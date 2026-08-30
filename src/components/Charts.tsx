/** Lightweight glass-styled horizontal bar chart — no external chart library dependency. */
export function BarChart({ data, valueFormatter }: { data: { label: string; value: number }[]; valueFormatter?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const format = valueFormatter ?? ((n: number) => String(n));

  if (data.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No data yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 110, fontSize: 12.5, color: 'var(--text-muted)', flexShrink: 0 }}>{d.label}</div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }} />
          </div>
          <div style={{ width: 70, fontSize: 12.5, fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{format(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

/** Simple SVG donut chart for status breakdowns. */
export function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce<{ label: string; value: number; color: string; dash: number; offset: number }[]>((acc, d) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.dash : 0;
    acc.push({ ...d, dash, offset });
    return acc;
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={14}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
            transform="rotate(-90 60 60)"
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
            <span style={{ fontWeight: 700 }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
