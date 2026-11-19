import { NextResponse } from "next/server";
import type { ApiResponse, Reading } from "@/lib/types";

export const dynamic = "force-dynamic";

const NETPIE_SHADOW_URL = "https://api.netpie.io/v2/device/shadow/data";
const NUMERIC_FIELDS = ["w_g", "t_c", "rh", "light_raw"] as const;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// timestamp อาจมาเป็นวินาทีหรือมิลลิวินาที: แปลงให้เป็นมิลลิวินาทีเสมอ
function toMs(ts: unknown): number {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return Date.now();
  return ts < 1e12 ? ts * 1000 : ts;
}

export async function GET() {
  const id = process.env.NETPIE_CLIENT_ID;
  const token = process.env.NETPIE_TOKEN;
  if (!id || !token) {
    return fail(
      "ยังไม่ได้ตั้ง NETPIE_CLIENT_ID / NETPIE_TOKEN ใน .env.local",
      500,
    );
  }

  try {
    // token อยู่ฝั่ง server เท่านั้น ไม่ถูกส่งไปที่เบราว์เซอร์
    const res = await fetch(NETPIE_SHADOW_URL, {
      headers: { Authorization: `Device ${id}:${token}` },
      cache: "no-store",
    });
    if (!res.ok) return fail(`NETPIE ${res.status}`, 502);

    const json = (await res.json()) as {
      data?: Record<string, unknown>;
      timestamp?: unknown;
    };
    const d = json.data;
    if (!d || typeof d.seq !== "number") {
      return fail("ยังไม่มีข้อมูลใน Shadow (gateway อาจยังไม่ส่ง)", 404);
    }

    const data = { ...d } as unknown as Reading;

    // เซนเซอร์ที่อ่านพลาดจะมาเป็น null: ตัดทิ้ง ไม่ปล่อยให้หน้าเว็บเจอ null
    for (const k of NUMERIC_FIELDS) {
      const v = data[k] as unknown;
      if (typeof v !== "number" || !Number.isFinite(v)) {
        delete (data as Partial<Reading>)[k];
      }
    }

    const body: ApiResponse = {
      source: "netpie",
      timestamp: toMs(json.timestamp),
      data,
    };
    return NextResponse.json(body);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "fetch failed", 502);
  }
}