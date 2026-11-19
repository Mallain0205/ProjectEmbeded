#pragma once
#include <stdint.h>

typedef struct __attribute__((packed)) {
  char     node_id[8];
  uint32_t seq;
  float    w_g;     // น้ำหนัก (g) -1 = ไม่มีค่า
  float    t_c;     // อุณหภูมิ (C)
  float    rh;      // ความชื้น (%)
} Msg;