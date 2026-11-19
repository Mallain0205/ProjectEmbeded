import type { ReactNode } from "react";
import Sparkline from "./Sparkline";

type Props = {
  label: string;
  value: string;
  unit: string;
  color: string; // CSS color เช่น "var(--temp)"
  icon: ReactNode;
  history: number[];
  hint?: string;
  digits?: number;
};

export default function MetricCard({
  label,
  value,
  unit,
  color,
  icon,
  history,
  hint,
  digits,
}: Props) {
  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              color,
              background: `color-mix(in srgb, ${color} 14%, transparent)`,
            }}
          >
            {icon}
          </span>
          <h2 className="text-base font-medium">{label}</h2>
        </div>
        {hint && (
          <span className="rounded-md border border-line px-2 py-0.5 text-xs text-muted">
            {hint}
          </span>
        )}
      </div>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tabular-nums">{value}</span>
        <span className="text-base text-muted">{unit}</span>
      </p>

      <div className="mt-3">
        <Sparkline
          values={history}
          color={color}
          label={label}
          unit={unit}
          digits={digits}
        />
      </div>
    </section>
  );
}
