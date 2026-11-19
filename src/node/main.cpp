#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <math.h>
#include "messages.h"

#define WIFI_CH 6   // ต้องตรงกับ channel ที่ gateway พิมพ์ออกมา

// วันนี้ใช้ broadcast ไปก่อน ไม่ต้องรู้ MAC ของ gateway
// ภายหลังเปลี่ยนเป็น MAC จริงของ gateway เพื่อทำ unicast + ACK
uint8_t GW_MAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

uint32_t seq = 0;
float simW = 800.0;   // น้ำหนักผ้าจำลอง (g)

void setup() {
  Serial.begin(115200);
  delay(1000);

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

  // ===== ค่าจำลอง: แทนด้วยการอ่านเซนเซอร์จริงภายหลัง =====
  simW -= 0.5 + random(0, 10) / 20.0;          // น้ำหนักลดลงเหมือนผ้ากำลังแห้ง
  if (simW < 300) simW = 800;                   // เริ่มรอบใหม่
  m.w_g = simW;                                 // <- แทนด้วย scale.get_units()
  m.t_c = 30 + 3 * sin(millis() / 60000.0) + random(-5, 5) / 10.0;      // <- dht.readTemperature()
  m.rh  = 60 + 10 * sin(millis() / 90000.0 + 1) + random(-5, 5) / 10.0; // <- dht.readHumidity()
  // =====================================================

  esp_err_t r = esp_now_send(GW_MAC, (uint8_t *)&m, sizeof(m));
  Serial.printf("seq=%u w=%.1f t=%.1f rh=%.1f send=%s\n",
                m.seq, m.w_g, m.t_c, m.rh, r == ESP_OK ? "ok" : "fail");
  delay(5000);
}