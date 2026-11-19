"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import MetricCard from "@/components/MetricCard";
import {
  AlertIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudRainIcon,
  DropletIcon,
  GaugeIcon,
  SunIcon,
  ThermometerIcon,
  UmbrellaIcon,
  WeightIcon,
} from "@/components/icons";
import type { ApiResponse, Reading } from "@/lib/types";

const POLL_MS = 2000;
const MAX_POINTS = 60;
const STALE_MS = 10000;

// เกณฑ์ตามลอจิกควบคุมในโน้ตโปรเจกต์
const RAIN_HIGH = 0.6; // เข้าที่ร่ม
const RAIN_LOW = 0.3; // ออกไปตากได้

type Point = { t: number; r: Reading };

function lightLabel(raw: number) {
  return `${Math.round((raw / 4095) * 100)}%`;
}

export default function Home() {
  const [points, setPoints] = useState<Point[]>([]);
  const [source, setSource] = useState<"netpie" | "mock" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastSeq = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/shadow", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse = await res.json();
        if (!alive) return;
        setSource(json.source);
        setError(null);
        // NETPIE shadow คืนค่าล่าสุดเสมอ: เก็บจุดใหม่เฉพาะเมื่อ seq เปลี่ยน
        if (json.data.seq !== lastSeq.current) {
          lastSeq.current = json.data.seq;
          setPoints((p) =>
            [...p, { t: json.timestamp, r: json.data }].slice(-MAX_POINTS),
          );
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "error");
      }
    }
    tick();
    const poll = setInterval(tick, POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const latest = points.at(-1);
  const r = latest?.r;
  const age = latest ? now - latest.t : null;
  const stale = age !== null && age > STALE_MS && source === "netpie";
  const hasWeight = r !== undefined && r.w_g >= 0;
  const down = error !== null || stale;

  const series = (f: (r: Reading) => number) => points.map((p) => f(p.r));
  const fmt = (n: number | undefined, d = 1) =>
    n === undefined || Number.isNaN(n) ? "–" : n.toFixed(d);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">DryWise</h1>
          <p className="text-sm text-muted">
            ราวตากผ้าหมุนหนีฝน · node{" "}
            <span className="font-mono">{r?.node_id ?? "—"}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {source === "mock" && (
            <span className="rounded-full bg-warn-bg px-3 py-1.5 text-warn-fg">
              ข้อมูลจำลอง
            </span>
          )}
          <span
            role="status"
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
              down ? "bg-bad-bg text-bad-fg" : "bg-ok-bg text-ok-fg"
            }`}
          >
            {down ? (
              <AlertIcon className="h-4 w-4" />
            ) : latest ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ClockIcon className="h-4 w-4" />
            )}
            {error
              ? "เชื่อมต่อไม่ได้"
              : stale
                ? "ไม่มีข้อมูลใหม่"
                : latest
                  ? "ออนไลน์"
                  : "กำลังเชื่อมต่อ"}
            {!down && latest && (
              <span
                aria-hidden="true"
                className="live-dot h-2 w-2 rounded-full bg-current"
              />
            )}
          </span>
        </div>
      </header>

      {r?.rain === true && (
        <div
          role="alert"
          className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-bad-bg px-5 py-4 text-bad-fg"
        >
          <CloudRainIcon className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">ตรวจพบฝน</p>
            <p className="text-sm">ราวควรเข้าที่ร่มทันที (ไม่ผ่านโมเดล AI)</p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="อุณหภูมิ"
          value={fmt(r?.t_c)}
          unit="°C"
          color="var(--temp)"
          icon={<ThermometerIcon />}
          history={series((x) => x.t_c)}
          hint="DHT22"
        />
        <MetricCard
          label="ความชื้นสัมพัทธ์"
          value={fmt(r?.rh)}
          unit="%"
          color="var(--humid)"
          icon={<DropletIcon />}
          history={series((x) => x.rh)}
          hint="DHT22"
        />
        <MetricCard
          label="ความสว่าง"
          value={r ? lightLabel(r.light_raw) : "–"}
          unit={r ? `raw ${r.light_raw}` : ""}
          color="var(--light)"
          icon={<SunIcon />}
          history={series((x) => x.light_raw)}
          hint="KY-018"
          digits={0}
        />
        <MetricCard
          label="น้ำหนักผ้า"
          value={hasWeight ? fmt(r?.w_g, 0) : "–"}
          unit={hasWeight ? "g" : "ไม่มี HX711"}
          color="var(--weight)"
          icon={<WeightIcon />}
          history={hasWeight ? series((x) => x.w_g) : []}
          hint="Load cell"
          digits={0}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Tile
          title="ความกดอากาศ"
          icon={<GaugeIcon />}
          value={
            r?.pressure_hpa !== undefined
              ? `${fmt(r.pressure_hpa)} hPa`
              : "รอ BMP280"
          }
          muted={r?.pressure_hpa === undefined}
        />

        <Tile
          title="โอกาสฝน (AI)"
          icon={<CloudRainIcon />}
          value={
            r?.p_rain !== undefined
              ? `${Math.round(r.p_rain * 100)}%`
              : "รอโมเดล"
          }
          muted={r?.p_rain === undefined}
        >
          {r?.p_rain !== undefined && <RainMeter p={r.p_rain} />}
        </Tile>

        <Tile
          title="ตำแหน่งราว"
          icon={r?.rack_pos === "shade" ? <UmbrellaIcon /> : <SunIcon />}
          value={
            r?.rack_pos === "shade"
              ? "ใต้ที่ร่ม"
              : r?.rack_pos === "sun"
                ? "นอกชายคา"
                : "รอ servo"
          }
          muted={r?.rack_pos === undefined}
        />
      </div>

      <footer className="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span>
          seq {r?.seq ?? "–"} ·{" "}
          {latest
            ? `อัปเดต ${new Date(latest.t).toLocaleTimeString("th-TH")} (${Math.round((age ?? 0) / 1000)} วินาทีที่แล้ว)`
            : "—"}
        </span>
        <span>
          รีเฟรชทุก {POLL_MS / 1000} วินาที · เก็บย้อนหลัง {MAX_POINTS} จุด
        </span>
      </footer>
    </main>
  );
}

function Tile({
  title,
  icon,
  value,
  muted,
  children,
}: {
  title: string;
  icon: ReactNode;
  value: string;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-base font-medium text-muted">
        {icon}
        {title}
      </h2>
      <p
        className={`mt-2 text-2xl font-semibold ${muted ? "text-muted" : ""}`}
      >
        {value}
      </p>
      {children}
    </section>
  );
}

// แถบโอกาสฝน พร้อมเครื่องหมายเกณฑ์ 30% / 60% จากลอจิกควบคุม
function RainMeter({ p }: { p: number }) {
  const pct = Math.round(p * 100);
  const state =
    p > RAIN_HIGH
      ? { text: "เข้าที่ร่ม", cls: "bg-bad-bg text-bad-fg", bar: "var(--bad-fg)" }
      : p < RAIN_LOW
        ? { text: "ตากได้", cls: "bg-ok-bg text-ok-fg", bar: "var(--ok-fg)" }
        : { text: "เฝ้าระวัง", cls: "bg-warn-bg text-warn-fg", bar: "var(--warn-fg)" };

  return (
    <div className="mt-3">
      <div
        role="meter"
        aria-label="โอกาสฝน"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}% ${state.text}`}
        className="relative h-2.5 rounded-full bg-line"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: state.bar }}
        />
        <span
          aria-hidden="true"
          className="absolute -top-1 h-4.5 w-px bg-ink"
          style={{ left: `${RAIN_LOW * 100}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute -top-1 h-4.5 w-px bg-ink"
          style={{ left: `${RAIN_HIGH * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          เกณฑ์ {RAIN_LOW * 100}% / {RAIN_HIGH * 100}%
        </span>
        <span className={`rounded-full px-2.5 py-0.5 font-medium ${state.cls}`}>
          {state.text}
        </span>
      </div>
    </div>
  );
}
