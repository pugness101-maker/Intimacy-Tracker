import type { Activity, ActivityType, AppData, Partner } from '../types';
import { isPartnerActivity } from '../types';
import { getStiDashboardStats } from './sti';
import {
  averageSatisfaction,
  collectUniquePartnerIds,
  compareActivitiesByDateTime,
  countByCategory,
  countByType,
  getActivityPeopleCount,
  getActivityStreak,
  getLastActivity,
  getMonthKey,
  isSameWeek,
  isToday,
} from './utils';

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface PartnerStats {
  partnerId: string;
  name: string;
  count: number;
  lastDate: string | null;
  avgSatisfaction: number | null;
}

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

const CHART_COLORS = [
  '#9b6b9e',
  '#b894be',
  '#7a9e8a',
  '#c9a87c',
  '#7a8eb8',
  '#c47a8a',
  '#8a7ab8',
  '#6b8e9e',
  '#9e8a6b',
  '#8e6b9e',
  '#6b9e8a',
];

export function getMonthlyActivities(
  activities: Activity[],
  monthKey?: string
): Activity[] {
  const key = monthKey ?? getMonthKey(new Date().toISOString().slice(0, 10));
  return activities.filter((a) => getMonthKey(a.date) === key);
}

export function buildHeatmap(
  activities: Activity[],
  monthsBack = 3
): HeatmapDay[] {
  const counts: Record<string, number> = {};
  for (const a of activities) {
    counts[a.date] = (counts[a.date] ?? 0) + 1;
  }

  const result: HeatmapDay[] = [];
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  start.setDate(1);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: counts[dateStr] ?? 0 });
  }
  return result;
}

export function getPartnerHistory(
  activities: Activity[],
  partners: Partner[]
): PartnerStats[] {
  const map = new Map<string, { count: number; dates: string[]; sat: number[] }>();

  for (const a of activities) {
    if (!isPartnerActivity(a.type)) continue;
    for (const partnerId of a.partnerIds) {
      const cur = map.get(partnerId) ?? { count: 0, dates: [], sat: [] };
      cur.count++;
      cur.dates.push(a.date);
      cur.sat.push(a.satisfaction);
      map.set(partnerId, cur);
    }
  }

  return partners
    .map((p) => {
      const stats = map.get(p.id);
      const dates = stats?.dates.sort((a, b) => b.localeCompare(a)) ?? [];
      const sat = stats?.sat ?? [];
      return {
        partnerId: p.id,
        name: p.nickname || p.name,
        count: stats?.count ?? 0,
        lastDate: dates[0] ?? null,
        avgSatisfaction:
          sat.length > 0
            ? Math.round((sat.reduce((s, n) => s + n, 0) / sat.length) * 10) / 10
            : null,
      };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function getUniquePartnerCount(activities: Activity[]): number {
  return collectUniquePartnerIds(activities).length;
}

export function getActivitiesToday(activities: Activity[], ref = new Date()): Activity[] {
  return activities.filter((a) => isToday(a.date, ref));
}

export function getPeopleToday(activities: Activity[], ref = new Date()): number {
  return getActivitiesToday(activities, ref).reduce(
    (sum, a) => sum + getActivityPeopleCount(a),
    0
  );
}

export function getUniquePartnersInWeek(
  activities: Activity[],
  ref = new Date()
): number {
  const weekActivities = activities.filter((a) => isSameWeek(a.date, ref));
  return collectUniquePartnerIds(weekActivities).length;
}

export function getUniquePartnersInMonth(
  activities: Activity[],
  ref = new Date()
): number {
  const monthKey = getMonthKey(ref.toISOString().slice(0, 10));
  const monthActivities = activities.filter(
    (a) => getMonthKey(a.date) === monthKey
  );
  return collectUniquePartnerIds(monthActivities).length;
}

export interface PeoplePerDayRow {
  date: string;
  label: string;
  people: number;
  activities: number;
}

export function getPeoplePerDayChart(
  activities: Activity[],
  days = 14
): PeoplePerDayRow[] {
  const result: PeoplePerDayRow[] = [];
  const end = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayActivities = activities.filter((a) => a.date === dateStr);
    const people = dayActivities.reduce(
      (sum, a) => sum + getActivityPeopleCount(a),
      0
    );
    result.push({
      date: dateStr,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      people,
      activities: dayActivities.length,
    });
  }
  return result;
}

export function getCondomUsageStats(activities: Activity[]): {
  yes: number;
  no: number;
  na: number;
  applicable: number;
  percentProtected: number | null;
} {
  const partnerActivities = activities.filter((a) => isPartnerActivity(a.type));
  const yes = partnerActivities.filter((a) => a.protection === 'yes').length;
  const no = partnerActivities.filter((a) => a.protection === 'no').length;
  const na = partnerActivities.filter((a) => a.protection === 'na').length;
  const applicable = yes + no;
  return {
    yes,
    no,
    na,
    applicable,
    percentProtected:
      applicable > 0 ? Math.round((yes / applicable) * 100) : null,
  };
}

export function getDashboardSummary(data: AppData) {
  const { activities } = data;
  const thisMonth = getMonthlyActivities(activities);

  const recent = [...activities].sort(compareActivitiesByDateTime).slice(0, 5);

  const upcomingHealth = [
    ...data.sexualHealth.birthControlReminders
      .filter((r) => r.nextDue)
      .map((r) => ({
        type: 'reminder' as const,
        date: r.nextDue!,
        label: r.title,
      })),
    ...data.sexualHealth.stiTests
      .filter((t) => t.followUpDate)
      .map((t) => ({
        type: 'sti_retest' as const,
        date: t.followUpDate!,
        label: 'STI retest',
      })),
  ]
    .filter((x) => x.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const stiStats = getStiDashboardStats(data.sexualHealth.stiTests);

  return {
    totalActivities: activities.length,
    totalPartnerActivities: countByCategory(activities, 'partner'),
    totalMasturbation: activities.filter((a) => a.type === 'masturbation').length,
    lastActivity: getLastActivity(activities),
    streak: getActivityStreak(activities),
    avgSatisfaction: averageSatisfaction(activities),
    monthCount: thisMonth.length,
    activitiesToday: getActivitiesToday(activities).length,
    peopleToday: getPeopleToday(activities),
    uniquePartnersThisWeek: getUniquePartnersInWeek(activities),
    uniquePartnersThisMonth: getUniquePartnersInMonth(activities),
    recent,
    upcomingHealth,
    stiStats,
  };
}

export function getTypeBreakdownChart(
  activities: Activity[],
  labels: Record<ActivityType, string>
): ChartSlice[] {
  const counts = countByType(activities);
  return Object.entries(counts)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([type, value], i) => ({
      label: labels[type as ActivityType],
      value: value ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function getMonthlyFrequencyChart(
  activities: Activity[],
  months = 6
): { label: string; value: number }[] {
  const result: { label: string; value: number }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d.toISOString().slice(0, 10));
    const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    const value = activities.filter((a) => getMonthKey(a.date) === key).length;
    result.push({ label, value });
  }
  return result;
}

export function getSatisfactionTrend(
  activities: Activity[],
  points = 12
): { label: string; value: number }[] {
  const sorted = [...activities]
    .sort((a, b) => -compareActivitiesByDateTime(a, b))
    .slice(-points);

  return sorted.map((a, i) => ({
    label: `${i + 1}`,
    value: a.satisfaction,
  }));
}

export function getPartnerBreakdownChart(
  activities: Activity[],
  partners: Partner[]
): ChartSlice[] {
  const history = getPartnerHistory(activities, partners);
  return history.map((p, i) => ({
    label: p.name,
    value: p.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}
