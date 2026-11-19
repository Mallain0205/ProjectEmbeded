#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <math.h>
#include "messages.h"
#include "secrets.h"

#define SIM_LIGHT 1      // 1 = ค่าแสงจำลอง, 0 = อ่านจาก KY-018
#define LDR_PIN   34     // ADC1 (ใช้เมื่อ SIM_LIGHT 0)

QueueHandle_t q;
WiFiClient net;
PubSubClient mqtt(net);

void onRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len == sizeof(Msg)) {
    Msg m;
    memcpy(&m, data, len);
    xQueueSend(q, &m, 0);
  }
} 

int readLight() {
#if SIM_LIGHT
  return (int)(2000 + 1000 * sin(millis() / 30000.0));
#else
  long s = 0;
  for (int i = 0; i < 16; i++) { s += analogRead(LDR_PIN); delay(2); }
  return s / 16;
#endif
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) delay(500);
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("WiFi OK, channel=%d  (เอาไปใส่ WIFI_CH ใน node)\n", WiFi.channel());
  else
    Serial.println("WiFi failed");
}

void connectMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;
  if (mqtt.connect(NP_CLIENT, NP_TOKEN, NP_SECRET)) {
    Serial.println("MQTT connected");
  } else {
    Serial.printf("MQTT failed rc=%d\n", mqtt.state());
    delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  WiFi.mode(WIFI_STA);
  Serial.print("Gateway MAC: ");
  Serial.println(WiFi.macAddress());
  connectWifi();

  mqtt.setServer("broker.netpie.io", 1883);
  mqtt.setBufferSize(512);

  q = xQueueCreate(10, sizeof(Msg));
  if (esp_now_init() != ESP_OK) Serial.println("ESP-NOW init failed");
  esp_now_register_recv_cb(onRecv);
}

void loop() {
  connectWifi();
  connectMqtt();
  mqtt.loop();

  Msg m;
  if (xQueueReceive(q, &m, 100 / portTICK_PERIOD_MS)) {
    // นับแพ็กเก็ตที่หายจากช่องว่างของ seq (ใช้คำนวณ PDR ทีหลัง)
    static uint32_t lastSeq = 0, lost = 0;
    if (m.seq <= lastSeq) lastSeq = 0;              // node รีบูต
    if (lastSeq && m.seq > lastSeq + 1) lost += m.seq - lastSeq - 1;
    lastSeq = m.seq;

    JsonDocument doc;
    JsonObject d = doc["data"].to<JsonObject>();
    d["node_id"]   = m.node_id;
    d["seq"]       = m.seq;
    d["w_g"]       = m.w_g;
    d["t_c"]       = m.t_c;
    d["rh"]        = m.rh;
    d["light_raw"] = readLight();
    d["lost"]      = lost;
    d["sim"]       = 1;                             // ข้อมูลจำลอง (ลบเมื่อใช้เซนเซอร์จริง)

    char buf[320];
    serializeJson(doc, buf);
    Serial.println(buf);
    if (mqtt.connected()) mqtt.publish("@shadow/data/update", buf);
  }
}