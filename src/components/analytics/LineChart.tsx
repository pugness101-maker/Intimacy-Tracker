interface LineChartProps {
  data: { label: string; value: number }[];
  min?: number;
  max?: number;
  height?: number;
}

export function LineChart({
  data,
  min = 1,
  max = 10,
  height = 120,
}: LineChartProps) {
  if (data.length === 0) {
    return <p className="chart-empty">No data for chart</p>;
  }

  const width = 100;
  const pad = 8;
  const range = max - min || 1;
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = pad + i * step;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const areaPoints = `${pad},${height - pad} ${points.join(' ')} ${pad + (data.length - 1) * step},${height - pad}`;

  return (
    <div className="line-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="line-chart__svg"
      >
        <polygon points={areaPoints} fill="var(--accent-soft)" />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const x = pad + i * step;
          const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
          return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--accent)" />;
        })}
      </svg>
      <div className="line-chart__axis">
        <span>{min}</span>
        <span>Satisfaction (last {data.length} logs)</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
