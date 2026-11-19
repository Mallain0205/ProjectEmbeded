#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <DHT.h>
#include "messages.h"

#define DHT_PIN 27
#define WIFI_CH 9   // ต้องตรงกับ channel ที่ gateway พิมพ์ออกมา

// broadcast ไปก่อน ภายหลังค่อยเปลี่ยนเป็น MAC จริงของ gateway
uint8_t GW_MAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

DHT dht(DHT_PIN, DHT22);
uint32_t seq = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  dht.begin();

  WiFi.mode(WIFI_STA);
  esp_wifi_set_promiscuous(true);
  esp_wifi_set_channel(WIFI_CH, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous(false);

  if (esp_now_init() != ESP_OK) Serial.println("ESP-NOW init failed");
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, GW_MAC, 6);
  peer.channel = WIFI_CH;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}

void loop() {
  Msg m = {};
  strcpy(m.node_id, "rack01");
  m.seq = ++seq;
  m.t_c = dht.readTemperature();   // อ่านพลาดจะได้ NaN
  m.rh  = dht.readHumidity();
  m.w_g = -1;                      // ยังไม่มี HX711 (เว็บจะแสดง "ไม่มี HX711")

  esp_err_t r = esp_now_send(GW_MAC, (uint8_t *)&m, sizeof(m));
  Serial.printf("seq=%u t=%.1f rh=%.1f send=%s\n",
                m.seq, m.t_c, m.rh, r == ESP_OK ? "ok" : "fail");
  delay(5000);
}