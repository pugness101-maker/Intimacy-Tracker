import type { HeatmapDay } from '../../lib/analytics';

interface HeatmapProps {
  days: HeatmapDay[];
}

export function Heatmap({ days }: HeatmapProps) {
  const max = Math.max(1, ...days.map((d) => d.count));

  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  for (const day of days) {
    const dow = new Date(day.date + 'T12:00:00').getDay();
    if (dow === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length) weeks.push(currentWeek);

  return (
    <div className="heatmap">
      <div className="heatmap__grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap__week">
            {week.map((day) => {
              const level =
                day.count === 0 ? 0 : Math.min(4, Math.ceil((day.count / max) * 4));
              return (
                <div
                  key={day.date}
                  className={`heatmap__cell heatmap__cell--${level}`}
                  title={`${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap__legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`heatmap__cell heatmap__cell--${l}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
