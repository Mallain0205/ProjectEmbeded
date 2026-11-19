"use client";
import { useEffect, useState } from "react";

export interface Point { t: number; v: number }
export interface Readings {
  latest: Record<string, number | string>;
  history: Record<string, Point[]>;
  feedStatus: number;
  fetchedAt: number;
}

export function useReadings(intervalMs = 5000, minutes = 30) {
  const [data, setData] = useState<Readings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch(`/api/netpie?minutes=${minutes}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        if (!stop) { setData(json); setError(null); }
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : String(e));
      }
    }
    load();
    const id = setInterval(load, intervalMs);
    return () => { stop = true; clearInterval(id); };
  }, [intervalMs, minutes]);

  return { data, error };
}