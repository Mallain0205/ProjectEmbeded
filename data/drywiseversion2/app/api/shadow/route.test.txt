import { NextResponse } from "next/server";
import type { ApiResponse, Reading } from "@/lib/types";

export const dynamic = "force-dynamic";

let mockSeq = 0;

function mockReading(): Reading {
  mockSeq += 1;
  const t = Date.now() / 1000;
  return {
    node_id: "rack01",
    seq: mockSeq,
    w_g: 420 + Math.sin(t / 30) * 6 + Math.random() * 2,
    t_c: 31 + Math.sin(t / 60) * 1.5 + Math.random() * 0.2,
    rh: 62 + Math.sin(t / 45) * 5 + Math.random() * 0.5,
    light_raw: Math.round(2400 + Math.sin(t / 20) * 900 + Math.random() * 40),
    pressure_hpa: 1008 + Math.sin(t / 120) * 2,
    rain: false,
    p_rain: Math.max(0, Math.min(1, 0.25 + Math.sin(t / 90) * 0.2)),
    rack_pos: "sun",
  };
}

export async function GET() {
  const id = process.env.NETPIE_CLIENT_ID;
  const token = process.env.NETPIE_TOKEN;

  if (!id || !token) {
    const body: ApiResponse = {
      source: "mock",
      timestamp: Date.now(),
      data: mockReading(),
    };
    return NextResponse.json(body);
  }

  try {
    // NETPIE 2020 shadow REST API: token อยู่ฝั่ง server เท่านั้น
    const res = await fetch("https://api.netpie.io/v2/device/shadow/data", {
      headers: { Authorization: `Device ${id}:${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `NETPIE ${res.status}` },
        { status: 502 },
      );
    }
    const json = await res.json();
    const body: ApiResponse = {
      source: "netpie",
      timestamp: json.timestamp ?? Date.now(),
      data: json.data as Reading,
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
