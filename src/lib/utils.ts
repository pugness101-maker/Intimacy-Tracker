import type { Activity, ActivityCategory, ActivityType, Partner } from '../types';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_TYPE_LABELS,
  getActivityCategory,
  isPartnerActivity,
} from '../types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeTime(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed || null;
}

export function calculateDurationMinutes(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number | null {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60;
  return Math.max(0, endMins - startMins);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return 'Not recorded';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function compareActivitiesByDateTime(a: Activity, b: Activity): number {
  const dateCmp = b.date.localeCompare(a.date);
  if (dateCmp !== 0) return dateCmp;
  return (b.startTime ?? '').localeCompare(a.startTime ?? '');
}

export function formatActivitySchedule(activity: Activity): string {
  const { startTime, endTime, durationMinutes } = activity;
  const duration = formatDuration(durationMinutes);

  if (startTime && endTime) {
    return `${formatTime(startTime)} – ${formatTime(endTime)} · ${duration}`;
  }
  if (startTime || endTime) {
    const parts: string[] = [];
    if (startTime) parts.push(`Start: ${formatTime(startTime)}`);
    if (endTime) parts.push(`End: ${formatTime(endTime)}`);
    parts.push(`Duration: ${duration}`);
    return parts.join(' · ');
  }
  return `Duration: ${duration}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function isSameMonth(dateStr: string, ref = new Date()): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

export function isSameWeek(dateStr: string, ref = new Date()): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  const start = getWeekStart(ref);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return d >= start && d < end;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function activityMatchesCategory(
  type: ActivityType,
  category: ActivityCategory | 'all'
): boolean {
  if (category === 'all') return true;
  return getActivityCategory(type) === category;
}

export function getPartnerLastIntimacy(
  partnerId: string,
  activities: Activity[]
): string | null {
  const partnerActivities = activities
    .filter(
      (a) =>
        a.partnerIds.includes(partnerId) &&
        (isPartnerActivity(a.type) ||
          getActivityCategory(a.type) === 'relationship')
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return partnerActivities[0]?.date ?? null;
}

export function resolveActivityPeopleCount(
  partnerIds: string[],
  manualCount: number
): number | null {
  if (partnerIds.length > 0) return partnerIds.length;
  if (manualCount > 0) return manualCount;
  return null;
}

export function getActivityPeopleCount(activity: Activity): number {
  if (activity.partnerIds.length > 0) return activity.partnerIds.length;
  if (activity.peopleCount != null && activity.peopleCount > 0) {
    return activity.peopleCount;
  }
  return 0;
}

export function isToday(dateStr: string, ref = new Date()): boolean {
  return dateStr === ref.toISOString().slice(0, 10);
}

export function collectUniquePartnerIds(activities: Activity[]): string[] {
  const ids = new Set<string>();
  for (const a of activities) {
    for (const id of a.partnerIds) ids.add(id);
  }
  return [...ids];
}

export function formatDateNumeric(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

export function getPartnerNames(
  partnerIds: string[],
  partners: Partner[]
): string[] {
  return partnerIds
    .map((id) => partners.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p!.nickname || p!.name);
}

export function getActivityStreak(activities: Activity[]): number {
  if (activities.length === 0) return 0;
  const dates = [...new Set(activities.map((a) => a.date))].sort(
    (a, b) => b.localeCompare(a)
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dates.includes(expectedStr)) {
      streak++;
    } else if (i === 0 && dates[0] !== expectedStr) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dates[0] === yesterday.toISOString().slice(0, 10)) {
        streak = 1;
        for (let j = 1; j < dates.length; j++) {
          const exp = new Date(yesterday);
          exp.setDate(exp.getDate() - j);
          if (dates.includes(exp.toISOString().slice(0, 10))) streak++;
          else break;
        }
      }
      break;
    } else {
      break;
    }
  }
  return streak;
}

export function countByType(
  activities: Activity[],
  filter?: (a: Activity) => boolean
): Partial<Record<ActivityType, number>> {
  const base: Partial<Record<ActivityType, number>> = {};
  const list = filter ? activities.filter(filter) : activities;
  for (const a of list) {
    base[a.type] = (base[a.type] ?? 0) + 1;
  }
  return base;
}

export function countByCategory(
  activities: Activity[],
  category: ActivityCategory
): number {
  return activities.filter(
    (a) => getActivityCategory(a.type) === category
  ).length;
}

export function averageSatisfaction(activities: Activity[]): number | null {
  const rated = activities.filter((a) => a.satisfaction != null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((s, a) => s + a.satisfaction!, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

export function getLastActivity(activities: Activity[]): Activity | null {
  if (activities.length === 0) return null;
  return [...activities].sort(compareActivitiesByDateTime)[0];
}

/** Activities that have a recorded duration (for analytics). */
export function getActivitiesWithDuration(activities: Activity[]): Activity[] {
  return activities.filter((a) => a.durationMinutes != null);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getPartnerName(
  partnerId: string | null | undefined,
  partners: Partner[]
): string {
  if (!partnerId) return '';
  const p = partners.find((x) => x.id === partnerId);
  return p ? p.nickname || p.name : 'Unknown';
}

export function activityIncludesPartner(
  activity: Activity,
  partnerId: string
): boolean {
  return activity.partnerIds.includes(partnerId);
}

export function getActivityLabel(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type] ?? type;
}

export { isPartnerActivity, getActivityCategory, ACTIVITY_CATEGORIES };
