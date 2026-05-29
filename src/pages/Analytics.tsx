import { useMemo } from 'react';
import {
  buildHeatmap,
  getMonthlyFrequencyChart,
  getPartnerBreakdownChart,
  getPartnerHistory,
  getPeoplePerDayChart,
  getSatisfactionTrend,
  getTypeBreakdownChart,
  getUniquePartnerCount,
} from '../lib/analytics';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Heatmap } from '../components/analytics/Heatmap';
import { PieChart } from '../components/analytics/PieChart';
import { BarChart } from '../components/analytics/BarChart';
import { LineChart } from '../components/analytics/LineChart';
import { ACTIVITY_TYPE_LABELS } from '../types';
import { formatDate, getActivityStreak } from '../lib/utils';

export function Analytics() {
  const { data } = useApp();
  const streak = getActivityStreak(data.activities);
  const partnerHistory = getPartnerHistory(data.activities, data.partners);
  const uniquePartners = getUniquePartnerCount(data.activities);
  const heatmapDays = useMemo(
    () => buildHeatmap(data.activities),
    [data.activities]
  );

  const typePie = useMemo(
    () => getTypeBreakdownChart(data.activities, ACTIVITY_TYPE_LABELS),
    [data.activities]
  );
  const monthlyFreq = useMemo(
    () => getMonthlyFrequencyChart(data.activities),
    [data.activities]
  );
  const satisfactionTrend = useMemo(
    () => getSatisfactionTrend(data.activities),
    [data.activities]
  );
  const partnerBreakdown = useMemo(
    () => getPartnerBreakdownChart(data.activities, data.partners),
    [data.activities, data.partners]
  );
  const peoplePerDay = useMemo(
    () => getPeoplePerDayChart(data.activities),
    [data.activities]
  );

  if (data.activities.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Analytics</h1>
          <p className="page-header__sub">Patterns and insights from your logs</p>
        </header>
        <EmptyState
          icon="▦"
          title="Not enough data yet"
          description="Log a few activities to see charts, satisfaction trends, partner breakdowns, and your activity heatmap."
        />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Analytics</h1>
        <p className="page-header__sub">Patterns and insights from your logs</p>
      </header>

      <div className="stat-grid stat-grid--4">
        <Card className="stat-card">
          <span className="stat-card__label">Total activities</span>
          <span className="stat-card__value">{data.activities.length}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Unique partners</span>
          <span className="stat-card__value">{uniquePartners}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Activity streak</span>
          <span className="stat-card__value">{streak}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Partner-linked logs</span>
          <span className="stat-card__value">{partnerHistory.length}</span>
        </Card>
      </div>

      <section className="section">
        <h2>Activity type breakdown</h2>
        <Card className="chart-card">
          <PieChart data={typePie} />
        </Card>
      </section>

      <section className="section">
        <h2>Monthly frequency</h2>
        <Card className="chart-card">
          <BarChart data={monthlyFreq} />
        </Card>
      </section>

      <section className="section">
        <h2>Satisfaction trend</h2>
        <Card className="chart-card">
          <LineChart data={satisfactionTrend} />
        </Card>
      </section>

      <section className="section">
        <h2>People per day</h2>
        <Card className="chart-card">
          <BarChart
            data={peoplePerDay.map((d) => ({ label: d.label, value: d.people }))}
            color="#7a9e8a"
          />
          <table className="people-per-day-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activities</th>
                <th>People</th>
              </tr>
            </thead>
            <tbody>
              {[...peoplePerDay].reverse().map((row) => (
                <tr key={row.date}>
                  <td>{row.label}</td>
                  <td>{row.activities}</td>
                  <td>{row.people}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="section">
        <h2>Partner activity breakdown</h2>
        <Card className="chart-card">
          {partnerBreakdown.length === 0 ? (
            <p className="text-muted">No partner-linked activities yet.</p>
          ) : (
            <BarChart data={partnerBreakdown} color="var(--success)" />
          )}
        </Card>
      </section>

      <section className="section">
        <h2>Partner history</h2>
        {partnerHistory.length === 0 ? (
          <p className="text-muted">No partner-linked activities yet.</p>
        ) : (
          <div className="card-list">
            {partnerHistory.map((p) => (
              <Card key={p.partnerId} className="mini-card partner-stat">
                <strong>{p.name}</strong>
                <span>{p.count} activities</span>
                {p.lastDate && (
                  <span className="text-muted">Last: {formatDate(p.lastDate)}</span>
                )}
                {p.avgSatisfaction !== null && (
                  <span>★ avg {p.avgSatisfaction}</span>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Calendar heatmap</h2>
        <Card>
          <Heatmap days={heatmapDays} />
        </Card>
      </section>
    </div>
  );
}
