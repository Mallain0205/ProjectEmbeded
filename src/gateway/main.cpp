#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <math.h>
#include "messages.h"
#include "secrets.h"

#define RAIN_AO_PIN 35      // AO ของโมดูลฝน (ADC1)
#define RAIN_DO_PIN 25      // DO (เตรียมไว้ทำ ISR ภายหลัง)
#define RAIN_DEBUG  1       // 1 = พิมพ์ค่าดิบทุก 1 วินาที ใช้ตอน calibrate

// ค่า raw ยิ่งต่ำยิ่งเปียก (ปรับตามผล calibrate ในข้อ 3)
#define RAIN_ON_BELOW   2500   // ต่ำกว่านี้ = ฝน
#define RAIN_OFF_ABOVE  3000   // สูงกว่านี้ = แห้ง (ช่องว่างกันค่ากระพริบ)

QueueHandle_t q;
WiFiClient net;
PubSubClient mqtt(net);

int  rainRaw = 4095;
bool rainState = false;

void onRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len == sizeof(Msg)) {
    Msg m;
    memcpy(&m, data, len);
    xQueueSend(q, &m, 0);
  }
}

int readRainRaw() {
  long s = 0;
  for (int i = 0; i < 16; i++) { s += analogRead(RAIN_AO_PIN); delay(2); }
  return s / 16;
}

void updateRain() {
  rainRaw = readRainRaw();
  if (!rainState && rainRaw < RAIN_ON_BELOW) rainState = true;
  else if (rainState && rainRaw > RAIN_OFF_ABOVE) rainState = false;
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) delay(500);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi OK, channel=%d  (เอาไปใส่ WIFI_CH ใน node)\n", WiFi.channel());
    Serial.print("Gateway MAC: ");
    Serial.println(WiFi.macAddress());
  } else {
    Serial.println("WiFi failed");
  }
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
  pinMode(RAIN_DO_PIN, INPUT);
  analogSetPinAttenuation(RAIN_AO_PIN, ADC_11db);

  WiFi.mode(WIFI_STA);
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

  // อ่านเซนเซอร์ฝนทุก 500 ms แยกจากการรับข้อมูล node
  static uint32_t lastRain = 0, lastDbg = 0;
  if (millis() - lastRain >= 500) {
    lastRain = millis();
    updateRain();
#if RAIN_DEBUG
    if (millis() - lastDbg >= 1000) {
      lastDbg = millis();
      Serial.printf("rain_raw=%d DO=%d rain=%d\n",
                    rainRaw, digitalRead(RAIN_DO_PIN), rainState);
    }
#endif
  }

  Msg m;
  if (xQueueReceive(q, &m, 100 / portTICK_PERIOD_MS)) {
    // นับแพ็กเก็ตที่หายจากช่องว่างของ seq (ใช้คำนวณ PDR ทีหลัง)
    static uint32_t lastSeq = 0, lost = 0;
    if (m.seq <= lastSeq) lastSeq = 0;   // node รีบูต
    if (lastSeq && m.seq > lastSeq + 1) lost += m.seq - lastSeq - 1;
    lastSeq = m.seq;

    JsonDocument doc;
    JsonObject d = doc["data"].to<JsonObject>();
    d["node_id"] = m.node_id;
    d["seq"]     = m.seq;
    d["w_g"]     = m.w_g;
    if (isnan(m.t_c)) d["t_c"] = nullptr; else d["t_c"] = m.t_c;
    if (isnan(m.rh))  d["rh"]  = nullptr; else d["rh"]  = m.rh;
    d["rain"]     = rainState;
    d["rain_raw"] = rainRaw;
    d["lost"]     = lost;

    char buf[320];
    serializeJson(doc, buf);
    Serial.println(buf);
    if (mqtt.connected()) mqtt.publish("@shadow/data/update", buf);
  }
}