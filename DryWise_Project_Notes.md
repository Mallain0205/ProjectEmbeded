# DryWise: ราวตากผ้าหมุนหนีฝน (Prototype)

โน๊ตโปรเจกต์ Embedded System (CEDT) Final Project 2026
วันที่เขียนโน๊ต: 19 พ.ย. 2026

---

## 0. กำหนดการสำคัญ

| วันที่ | งาน |
|---|---|
| **ศุกร์ 20 พ.ย. 23:59** | Checkpoint video (≤2 นาที) โชว์ node → gateway → cloud → dashboard |
| อังคาร 8 ธ.ค. | นำเสนอ + เดโมสด (ส่งสไลด์ รายงาน PDF ≤10 หน้า วิดีโอ 3–5 นาที โค้ด + Git ภายใน 23:59) |
| พุธ 9 ธ.ค. 06:00 | หมดช่วง grace period หลังจากนี้ −5 คะแนน/วัน |

ถ้ายังไม่ได้ส่ง registration/proposal ให้ติดต่ออาจารย์/TA ทันที (ขาด milestone −2 คะแนน)

---

## 1. ขอบเขต Prototype

ราวตากผ้าขนาดเล็ก 1 ตัว แขนหมุนได้ 2 ตำแหน่ง
- **นอกชายคา**: รับแดด
- **ใต้ที่ร่ม**: เมื่อ AI ทำนายว่าฝนจะตก หรือเซนเซอร์ฝนเจอน้ำ servo หมุนแขนเข้าที่ร่ม แล้วแจ้งเตือนทาง Telegram

ไม่มีพัดลม ไม่มีมอเตอร์ DC ไม่มี node ตัวที่สอง (เพิ่มทีหลังได้ถ้ามีเวลา เพื่อได้ Scalability 3 คะแนน)

---

## 2. สถาปัตยกรรม

```
[Sensor Node: ESP32]  --ESP-NOW (JSON: node_id, seq, ...)-->  [Gateway: ESP32/ESP32-S3]
  - Load cell + HX711                                           - BMP280, Raindrop, KY-018
  - DHT22                                                       - AI (TFLite Micro)
                                                                - Servo (หมุนราว)
                                                                      |
                                                              Wi-Fi hotspot + MQTT
                                                                      v
                                                        NETPIE 2020 -> Dashboard + Telegram
```

---

## 3. รายการอุปกรณ์

### อิเล็กทรอนิกส์

| อุปกรณ์ | จำนวน | อยู่ที่ | นับเป็นเซนเซอร์ |
|---|---|---|---|
| ESP32 DevKit | 2 | Node 1 / Gateway 1 | - |
| Load cell 1–5 kg + HX711 | 1 | Node | น้ำหนัก (ชนิดที่ 1) |
| DHT22 | 1 | Node | อุณหภูมิ/ความชื้น (ชนิดที่ 2) |
| BMP280 (I2C) | 1 | Gateway | ความกดอากาศ (ชนิดที่ 3) |
| Raindrop sensor | 1 | Gateway | ฝน (ชนิดที่ 4) |
| Photo resistor KY-018 | 1 | Gateway | แสง (ชนิดที่ 5) |
| Servo MG996R หรือ DS3218 (ห้ามใช้ SG90) | 1 | Gateway | Actuator |
| ปุ่มกด (e-stop) | 1 | Gateway | ไม่นับ |
| Adapter / buck converter 5–6 V 3 A | 1 | ไฟ servo แยก | - |
| ตัวเก็บประจุ 470–1000 µF | 1 | คร่อมไฟ servo | - |
| Power bank + สาย USB | 2 | เลี้ยงบอร์ด | - |
| สายจั๊มเปอร์, breadboard | - | - | - |

เซนเซอร์ครบ **5 ชนิด** (node 2 / gateway 3) พอดีเกณฑ์ M1 ต้องมีครบทั้งห้า

### กลไก
- Turntable bearing (lazy Susan) ขนาดเล็ก ให้ลูกปืนรับน้ำหนัก servo ออกแรงหมุนอย่างเดียว
- แขนไม้/อลูมิเนียม ยาว ~25–30 cm ติดบนแกนหมุน
- Load cell ติดปลายแขนแบบคานยื่น + ตะขอแขวนไม้แขวนเสื้อ
- แผ่นหลังคาเล็ก (กล่องกระดาษแข็ง/ไม้อัด) ครอบโซนที่ร่ม
- ผ้าทดสอบเบา ๆ ไม่เกิน ~300–500 g

### ซอฟต์แวร์
- Arduino IDE (ESP32 core 3.x) + ไลบรารี: DHT sensor library, HX711 (bogde), Adafruit BMP280, ESP32Servo, PubSubClient, ArduinoJson
- NETPIE 2020 (ถ้าไม่ทันใช้ ThingSpeak แทนได้)
- Telegram bot (สร้างผ่าน @BotFather)
- GitHub repo (ทุกคน commit อย่างน้อย 1 ครั้ง)
- Python สำหรับเทรนโมเดล

---

## 4. การต่อสาย (ESP32 DevKit 30 ขา)

| อุปกรณ์ | ขา |
|---|---|
| Node: HX711 DT / SCK | GPIO16 / GPIO17 |
| Node: DHT22 data | GPIO27 |
| Gateway: BMP280 SDA / SCL | GPIO21 / GPIO22 |
| Gateway: KY-018 (S) | GPIO34 (ADC1) |
| Gateway: Raindrop DO | GPIO25 (ISR) |
| Gateway: ปุ่ม e-stop | GPIO26 (INPUT_PULLUP, ISR) |
| Gateway: Servo signal | GPIO18 |

ข้อควรระวัง
- ไฟ servo ต้องมาจาก adapter 5–6 V โดยตรง ห้ามดึงจากขา 5 V ของบอร์ด และต้องต่อ GND ร่วมกับ ESP32
- KY-018 จ่ายไฟ 3.3 V และต้องใช้ขา ADC1 (ESP32 ธรรมดา: GPIO32–39, ESP32-S3: GPIO1–10) เพราะ ADC2 ใช้ไม่ได้เมื่อเปิด Wi-Fi
- ค่า KY-018 เป็นค่าดิบ 0–4095 (ความสว่างสัมพัทธ์ ไม่ใช่ lux) ควรอ่านเฉลี่ยหลายตัวอย่าง
- ถ้าใช้ ESP32-S3 เลขขาต่างออกไป
- servo ต้องหมุนช้า ๆ ทีละองศา และมี timeout (ข้อกำหนด safety M7)

---

## 5. AI: ทำนายว่าฝนจะตกใน 1 ชั่วโมงข้างหน้าหรือไม่ (M4, E7)

1. ดึงข้อมูลรายชั่วโมงย้อนหลัง 2–3 ปีของกรุงเทพฯ จาก Open-Meteo (ฟรี): `surface_pressure`, ความชื้น, อุณหภูมิ, ปริมาณฝน
2. ฟีเจอร์: ความกดอากาศ, ความกดที่เปลี่ยนใน 1 และ 3 ชม., ความชื้น, อุณหภูมิ, ชั่วโมงของวัน
3. Label: ฝนในชั่วโมงถัดไป > 0.1 mm
4. เทรน MLP เล็ก ๆ (เช่น 2 hidden layers) ด้วย scikit-learn/Keras แปลงเป็น TFLite int8 ฝังเป็นอาร์เรย์ C รันบน gateway ด้วย TFLite Micro (นับ E7 ตาม FAQ ข้อ 4 ว่ารันบน gateway ได้)
5. ใช้ MLP ไม่ใช่สูตรเดียวแบบ logistic เพื่อไม่ให้ดูเหมือน if-else

ข้อควรระวัง
- BMP280 ต้องสะสมประวัติความกด 3 ชม. ก่อนจะทำนายได้ ให้เปิดเครื่องทิ้งไว้ก่อนวันเดโม
- KY-018 ไม่ใส่ในโมเดล (เทียบกับข้อมูลสาธารณะไม่ได้) ใช้ในเงื่อนไข "มีแดดพอจึงออกไปตาก"
- ช่วงนี้ฝนตกน้อย ตอนเดโมจำลองฝนด้วยสเปรย์ที่ raindrop sensor และใช้โหมด replay ป้อนความกดอากาศช่วงก่อนฝนตกจริงเข้าโมเดล ต้องบอกตรง ๆ ในรายงานว่าเป็นการจำลอง
- ทำ baseline แบบ if-else ("ความกดลด > X hPa/ชม.") แล้วเทียบกับโมเดล AI เพื่อใช้ตอบ Q&A และหัวข้อ Analysis

### ลอจิกควบคุม
- ISR ฝน (raindrop) -> เข้าที่ร่มทันที (ไม่ผ่านโมเดล)
- P(ฝน) > 0.6 และมีผ้าบนราว -> เข้าที่ร่ม
- P < 0.3 ต่อเนื่อง ~10 นาที ไม่มีฝน และแสงพอ -> ออกไปตาก
- รออย่างน้อย 5 นาทีก่อนสลับตำแหน่งแต่ละครั้ง (hysteresis)
- e-stop ISR -> หยุด servo ทันที

---

## 6. Embedded Depth (II′) ที่ทำได้โดยไม่เพิ่มฮาร์ดแวร์

| รายการ | ทำอะไร |
|---|---|
| E1 RTOS | Gateway แยก 3 tasks (`rx_task`, `ai_task`, `act_task`) สื่อสารผ่าน queue/semaphore พร้อมเหตุผลของ priority |
| E2 Interrupt | ISR สำหรับ raindrop และ e-stop แล้วปล่อย semaphore ให้ `act_task` |
| E5 Security | MQTT over TLS (พอร์ต 8883) + เก็บ secret ในไฟล์ที่อยู่ใน `.gitignore` |
| E7 On-device AI | TFLite Micro บน gateway |
| E4 (ทำเพิ่มถ้ามีเวลา) | ACK/retry ระหว่าง node กับ gateway + buffer เมื่อเน็ตหลุด |

---

## 7. เช็กลิสต์เงื่อนไขขั้นต่ำ

| ข้อ | ผ่านอย่างไร |
|---|---|
| M1 | 5 ชนิด (load cell, DHT22 / BMP280, raindrop, KY-018) node 2 / gateway 3 |
| M2 | servo |
| M3 | ESP-NOW |
| M4 | โมเดลทำนายฝน -> สั่ง servo |
| M5 | NETPIE + dashboard |
| M6 | Telegram bot |
| M7 | DC เท่านั้น, timeout, e-stop, หมุนช้า, แยกน้ำจากอิเล็กทรอนิกส์ |
| M8 | Git ที่ทุกคน commit |

---

## 8. Checkpoint 20 พ.ย. (ขั้นต่ำ)

ต้องโชว์เส้นทางข้อมูลครบ: **sensor node -> gateway -> cloud -> dashboard** ไม่ต้องมี servo, AI หรือแจ้งเตือน

### ของที่ต้องมี
ESP32 2 ตัว, DHT22, KY-018, สาย, power bank/USB, มือถือเปิด hotspot 2.4 GHz (HX711 ถ้ามี ใส่เพิ่มได้ ถ้าไม่ทันตัดออก)

### ขั้นตอน
1. **วันนี้:** อัปโหลดโค้ดทั้งสองฝั่ง ดู MAC ของ gateway ใน Serial ใส่ใน node และดู channel ของ hotspot ใส่ใน `WIFI_CH`
2. **วันนี้:** สร้าง Device บน NETPIE 2020 ได้ Client ID / Token / Secret ตั้ง Data Schema ให้เก็บข้อมูลแบบ time series
3. **คืนนี้/เช้าพรุ่งนี้:** ทำ dashboard (กราฟอุณหภูมิ ความชื้น แสง น้ำหนักถ้ามี)
4. **บ่ายพรุ่งนี้:** ถ่ายวิดีโอและอัปโหลดให้เสร็จก่อนค่ำ อย่ารอจนใกล้ 23:59

### ข้อควรระวัง
- ESP-NOW ต้องอยู่ channel เดียวกับ Wi-Fi ที่ gateway ต่อ ถ้า hotspot เปลี่ยน channel ข้อมูลจะหยุด (ตั้ง hotspot เป็น channel คงที่ เช่น 6)
- ESP32 รับเฉพาะ 2.4 GHz เปิดโหมด "ความเข้ากันได้สูงสุด" บน hotspot
- ห้ามใช้ Wi-Fi มหาวิทยาลัย
- ห้าม commit รหัส Wi-Fi / token

### รูปแบบข้อความ (ใส่ node_id และ seq ตั้งแต่แรก)
```json
{"node_id":"rack01","seq":1,"w_g":812.4,"t_c":31.2,"rh":64.5}
```

### โค้ด Node
(Arduino-ESP32 core 3.x)

```cpp
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <DHT.h>
#include "HX711.h"

#define DHT_PIN 27
#define HX_DT 16
#define HX_SCK 17
#define WIFI_CH 6                       // ให้ตรงกับ channel ของ hotspot
uint8_t GW_MAC[] = {0x00,0x00,0x00,0x00,0x00,0x00};  // ใส่ MAC ของ gateway

typedef struct { char node_id[8]; uint32_t seq; float w_g; float t_c; float rh; } Msg;

DHT dht(DHT_PIN, DHT22);
HX711 scale;
uint32_t seq = 0;

void setup() {
  Serial.begin(115200);
  dht.begin();
  scale.begin(HX_DT, HX_SCK);           // ถ้ายังไม่มี HX711 ให้คอมเมนต์ทิ้ง
  WiFi.mode(WIFI_STA);
  esp_wifi_set_promiscuous(true);
  esp_wifi_set_channel(WIFI_CH, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous(false);
  esp_now_init();
  esp_now_peer_info_t p = {};
  memcpy(p.peer_addr, GW_MAC, 6);
  p.channel = WIFI_CH; p.encrypt = false;
  esp_now_add_peer(&p);
}

void loop() {
  Msg m = {};
  strcpy(m.node_id, "rack01");
  m.seq = ++seq;
  m.t_c = dht.readTemperature();
  m.rh  = dht.readHumidity();
  m.w_g = scale.is_ready() ? scale.get_units(3) : -1;  // ค่าจริงต้อง calibrate
  esp_now_send(GW_MAC, (uint8_t*)&m, sizeof(m));
  Serial.printf("sent seq=%u t=%.1f rh=%.1f\n", m.seq, m.t_c, m.rh);
  delay(2000);
}
```

### โค้ด Gateway

```cpp
#include <WiFi.h>
#include <esp_now.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"   // WIFI_SSID, WIFI_PASS, NP_CLIENT, NP_TOKEN, NP_SECRET

#define LDR_PIN 34
typedef struct { char node_id[8]; uint32_t seq; float w_g; float t_c; float rh; } Msg;

QueueHandle_t q;
WiFiClient net;
PubSubClient mqtt(net);

void onRecv(const esp_now_recv_info_t*, const uint8_t* d, int len) {
  if (len == sizeof(Msg)) { Msg m; memcpy(&m, d, len); xQueueSend(q, &m, 0); }
}

int readLight() {
  long s = 0;
  for (int i = 0; i < 16; i++) { s += analogRead(LDR_PIN); delay(2); }
  return s / 16;
}

void connectMqtt() {
  while (!mqtt.connected()) {
    if (!mqtt.connect(NP_CLIENT, NP_TOKEN, NP_SECRET)) delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println(WiFi.macAddress());        // เอาไปใส่ใน node
  Serial.printf("channel=%d\n", WiFi.channel());  // เอาไปใส่ WIFI_CH
  mqtt.setServer("broker.netpie.io", 1883);
  q = xQueueCreate(10, sizeof(Msg));
  esp_now_init();
  esp_now_register_recv_cb(onRecv);
}

void loop() {
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
  Msg m;
  if (xQueueReceive(q, &m, 100 / portTICK_PERIOD_MS)) {
    JsonDocument doc;
    JsonObject d = doc["data"].to<JsonObject>();
    d["node_id"] = m.node_id; d["seq"] = m.seq;
    d["w_g"] = m.w_g; d["t_c"] = m.t_c; d["rh"] = m.rh;
    d["light_raw"] = readLight();
    char buf[256];
    serializeJson(doc, buf);
    mqtt.publish("@shadow/data/update", buf);
    Serial.println(buf);
  }
}
```

หมายเหตุ
- ถ้าใช้ core 2.x ต้องแก้ signature ของ `onRecv` เป็น `(const uint8_t *mac, const uint8_t *d, int len)`
- ตอนนี้ใช้พอร์ต 1883 เพื่อให้ผ่านเร็ว ตอนทำ E5 ค่อยเปลี่ยนเป็น `WiFiClientSecure` + พอร์ต 8883
- สร้าง `secrets.h` ใส่ข้อมูลจริง แล้วเพิ่มลง `.gitignore` และ commit เฉพาะ `secrets.example.h` ที่เป็นค่าว่าง

### สคริปต์วิดีโอ (≤2 นาที)
1. แนะนำสมาชิกและแนวคิดราวตากผ้า (~15 วินาที)
2. โชว์ node และ gateway (~15 วินาที)
3. เป่าลมใส่ DHT22 หรือเอามือบัง KY-018 แล้วโชว์ Serial ฝั่ง node (~30 วินาที)
4. โชว์ Serial ฝั่ง gateway ที่รับและส่งต่อ (~15 วินาที)
5. โชว์ dashboard ว่าค่าเปลี่ยนตามจริง (~30 วินาที)
6. บอกขั้นต่อไป: servo, AI ทำนายฝน, Telegram (~15 วินาที)

---

## 9. แผนหลัง Checkpoint (ถึง 8 ธ.ค.)

| ช่วง | งาน |
|---|---|
| 21–25 พ.ย. | ประกอบแขนหมุนกับ servo ให้สั่งจาก dashboard ได้ ดึงข้อมูล Open-Meteo เริ่มเทรนโมเดล |
| 26 พ.ย.–1 ธ.ค. | ใส่โมเดลลง gateway ต่อ closed loop เพิ่ม ISR/e-stop/Telegram เริ่มรัน field test ≥24 ชม. |
| 2–7 ธ.ค. | ทดสอบ failure (Wi-Fi หลุด ถอดเซนเซอร์ ไฟดับ) วัด metrics ทำรายงาน/วิดีโอ/สไลด์ |
| 8 ธ.ค. | นำเสนอ |

### Metrics ที่ควรวัด (อย่างน้อย 3 อย่าง วัดซ้ำและรายงาน mean/min/max)
- Packet delivery rate ระหว่าง node กับ gateway
- Latency: sensor -> dashboard และ ฝนตรวจพบ -> servo เริ่มหมุน
- ความแม่นยำ load cell เทียบตาชั่งอ้างอิง
- AI accuracy (precision/recall) เทียบ baseline if-else
- Uptime จากการรันต่อเนื่อง

### Test plan
- ปกติ: ฝนจำลองด้วยสเปรย์ -> ราวเข้าที่ร่ม
- Edge: เซนเซอร์ฝนเปียกค้าง, ผ้าหนักเบาต่างกัน
- Failure: Wi-Fi หลุด, ถอด HX711/DHT22, ไฟดับแล้วกลับมาต้อง recover เอง, servo ติดขัด

### ส่วนที่ต้องมีในรายงาน/Git
- บทบาทสมาชิกทุกคน (ต้องมี commit ของทุกคน)
- ประกาศการใช้ AI tools (ตามข้อ 4.6)
- อ้างอิงโค้ด/ไลบรารีที่ใช้
- ไม่ commit รหัส Wi-Fi / API key / token

---

## 10. ลำดับงานที่แนะนำ (ถ้าเวลาไม่พอ)

ตัดตามลำดับนี้ก่อน: E4 -> node ตัวที่สอง -> Telegram -> E5
ห้ามตัด: เซนเซอร์ 5 ชนิด, servo, โมเดล AI ที่คุม servo, cloud + dashboard, Git commit ของทุกคน
