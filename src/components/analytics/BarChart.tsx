interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  maxHeight?: number;
}

export function BarChart({
  data,
  color = 'var(--accent)',
  maxHeight = 140,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.every((d) => d.value === 0)) {
    return <p className="chart-empty">No data for chart</p>;
  }

  return (
    <div className="bar-chart">
      <div className="bar-chart__bars" style={{ height: maxHeight }}>
        {data.map((d) => (
          <div key={d.label} className="bar-chart__col">
            <div
              className="bar-chart__bar"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: color,
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="bar-chart__value">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="bar-chart__labels">
        {data.map((d) => (
          <span key={d.label} className="bar-chart__label">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
