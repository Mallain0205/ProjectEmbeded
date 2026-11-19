// ตรงกับ JSON ที่ gateway ส่งขึ้น NETPIE shadow (field ที่ยังไม่มีเป็น optional)
export type Reading = {
  node_id: string;
  seq: number;
  w_g: number; // น้ำหนัก (g), -1 = ไม่มี HX711
  t_c: number; // อุณหภูมิ (°C)
  rh: number; // ความชื้น (%)
  light_raw: number; // KY-018 ค่าดิบ 0-4095
  // ด้านล่างนี้ยังไม่ถูกส่งในโค้ด checkpoint เพิ่มทีหลังได้
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
