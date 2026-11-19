type Props = {
  values: number[];
  color: string; // CSS color เช่น "var(--temp)"
  label: string;
  unit?: string;
  digits?: number;
  height?: number;
};

// กราฟเส้น SVG ล้วน: มีจุดล่าสุด, ค่าต่ำสุด/สูงสุดเป็นตัวหนังสือ (ไม่พึ่งสีอย่างเดียว)
export default function Sparkline({
  values,
  color,
  label,
  unit = "",
  digits = 1,
  height = 72,
}: Props) {
  const w = 300;

  if (values.length < 2) {
    return (
      <div
        style={{ height: height + 20 }}
        className="flex items-center justify-center text-sm text-muted"
      >
        รอข้อมูล…
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 6;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${w},${height}`;
  const [lx, ly] = pts[pts.length - 1];
  const last = values[values.length - 1];
  const f = (n: number) => n.toFixed(digits);

  return (
    <div>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${w} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`กราฟ${label} ย้อนหลัง ${values.length} จุด ต่ำสุด ${f(min)} สูงสุด ${f(max)} ล่าสุด ${f(last)} ${unit}`}
        >
          <line
            x1="0"
            x2={w}
            y1={height / 2}
            y2={height / 2}
            stroke="var(--line)"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
          <polygon points={area} fill={color} opacity={0.14} />
          <polyline
            points={line}
            fill="none"
            stroke={color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        {/* จุดล่าสุดเป็น HTML เพื่อไม่ให้ถูก SVG ยืดเป็นวงรี */}
        <span
          aria-hidden="true"
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
          style={{
            left: `${(lx / w) * 100}%`,
            top: `${(ly / height) * 100}%`,
            background: color,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
        <span>
          ต่ำสุด {f(min)}
        </span>
        <span>
          สูงสุด {f(max)}
        </span>
      </div>
    </div>
  );
}
