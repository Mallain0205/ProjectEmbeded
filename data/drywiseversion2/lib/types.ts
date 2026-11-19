// ตรงกับ JSON ที่ gateway ส่งขึ้น NETPIE shadow (field ที่ยังไม่มีเป็น optional)
export type Reading = {
  node_id: string;
  seq: number;
  w_g: number; // น้ำหนัก (g), -1 = ไม่มี HX711
  t_c: number; // อุณหภูมิ (°C)
  rh: number; // ความชื้น (%)
  light_raw?: number; // KY-018 (ยังไม่ต่อ)
  rain_raw?: number;  // เซนเซอร์ฝน ค่าดิบ 0-4095 (ยิ่งต่ำยิ่งเปียก)
  pressure_hpa?: number;
  rain?: boolean;
  p_rain?: number;
  rack_pos?: "sun" | "shade";
};

export type ApiResponse = {
  source: "netpie" | "mock";
  timestamp: number;
  data: Reading;
};
