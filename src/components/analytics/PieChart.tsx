import type { ChartSlice } from '../../lib/analytics';

interface PieChartProps {
  data: ChartSlice[];
  size?: number;
}

export function PieChart({ data, size = 180 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <p className="chart-empty">No data for chart</p>;
  }

  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const slice = (d.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += slice;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = slice > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="pie-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <ul className="pie-chart__legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span className="pie-chart__dot" style={{ background: s.color }} />
            <span>
              {s.label} <strong>{s.value}</strong> ({s.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
