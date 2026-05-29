import {
  ALL_ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
  type AppData,
  type Partner,
  isPartnerActivity,
  supportsPartnerLink,
} from '../types';
import { calculateDurationMinutes, normalizeTime } from './utils';

function migratePartnerIds(
  raw: Record<string, unknown>,
  type: ActivityType
): string[] {
  if (!supportsPartnerLink(type)) return [];
  if (Array.isArray(raw.partnerIds)) {
    return raw.partnerIds.filter((id): id is string => typeof id === 'string');
  }
  const legacy = raw.partnerId;
  if (typeof legacy === 'string' && legacy) return [legacy];
  return [];
}

function migratePeopleCount(
  raw: Record<string, unknown>,
  partnerIds: string[],
  type: ActivityType
): number | null {
  if (!supportsPartnerLink(type)) return null;
  if (partnerIds.length > 0) return partnerIds.length;
  const count = raw.peopleCount;
  if (typeof count === 'number' && count > 0) return count;
  return null;
}

const LEGACY_TYPE_MAP: Record<string, ActivityType> = {
  partner: 'partner_sex',
  solo: 'masturbation',
  makeout: 'makeout',
  cuddling: 'cuddling',
  date_night: 'date_night',
  other: 'other',
};

function resolveType(raw: string): ActivityType {
  if (ALL_ACTIVITY_TYPES.includes(raw as ActivityType)) {
    return raw as ActivityType;
  }
  return LEGACY_TYPE_MAP[raw] ?? 'other';
}

export function migrateActivity(raw: Record<string, unknown>): Activity {
  const type = resolveType(String(raw.type ?? 'other'));
  const partnerIds = migratePartnerIds(raw, type);
  const protection = isPartnerActivity(type)
    ? ((raw.protection as Activity['protection']) ?? 'na')
    : 'na';

  const startTime = normalizeTime(raw.startTime as string | null | undefined);
  const endTime = normalizeTime(raw.endTime as string | null | undefined);
  const durationMinutes =
    startTime && endTime
      ? calculateDurationMinutes(startTime, endTime)
      : null;

  const peopleCount = migratePeopleCount(raw, partnerIds, type);

  return {
    id: String(raw.id ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    date: String(raw.date ?? ''),
    startTime,
    endTime,
    durationMinutes,
    type,
    partnerIds,
    peopleCount,
    satisfaction: Number(raw.satisfaction ?? 5),
    protection,
    notes: String(raw.notes ?? ''),
  };
}

export function migrateActivities(activities: unknown[]): Activity[] {
  return activities.map((a) =>
    migrateActivity((a ?? {}) as Record<string, unknown>)
  );
}

export function migratePartner(raw: Record<string, unknown>): Partner {
  return {
    id: String(raw.id ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    name: String(raw.name ?? ''),
    nickname: raw.nickname ? String(raw.nickname) : undefined,
    relationshipType: String(raw.relationshipType ?? 'Partner'),
    notes: String(raw.notes ?? ''),
  };
}

export function migratePartners(partners: unknown[]): Partner[] {
  return partners.map((p) =>
    migratePartner((p ?? {}) as Record<string, unknown>)
  );
}

export function migrateGoals(goals: AppData['goals']): AppData['goals'] {
  const mapType = (t: string): ActivityType => resolveType(t);
  return {
    ...goals,
    frequency: {
      ...goals.frequency,
      activityTypes: (goals.frequency.activityTypes ?? []).map(mapType),
    },
  };
}

export function migrateAppData(parsed: Partial<AppData>, defaults: AppData): AppData {
  return {
    ...defaults,
    ...parsed,
    goals: migrateGoals({ ...defaults.goals, ...parsed.goals }),
    sexualHealth: {
      ...defaults.sexualHealth,
      ...parsed.sexualHealth,
    },
    settings: { ...defaults.settings, ...parsed.settings },
    activities: migrateActivities((parsed.activities as unknown[]) ?? []),
    partners: migratePartners((parsed.partners as unknown[]) ?? []),
  };
}
