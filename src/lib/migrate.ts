import {
  ALL_ACTIVITY_TYPES,
  ACTIVITY_BIRTH_CONTROL_METHODS,
  type Activity,
  type ActivityBirthControlMethod,
  type ActivityType,
  type AppData,
  type BirthControlReminder,
  type BirthControlMethodType,
  BIRTH_CONTROL_METHOD_TYPES,
  type Partner,
  type ProtectionStatus,
  isPartnerActivity,
  supportsPartnerLink,
} from '../types';
import { calculateDurationMinutes, normalizeTime } from './utils';

const PROTECTION_VALUES: ProtectionStatus[] = ['yes', 'no', 'unsure', 'na'];

function migrateProtection(
  raw: Record<string, unknown>,
  type: ActivityType
): ProtectionStatus {
  if (!isPartnerActivity(type)) return 'na';
  const value = raw.protection;
  if (typeof value === 'string' && PROTECTION_VALUES.includes(value as ProtectionStatus)) {
    return value as ProtectionStatus;
  }
  return 'na';
}

function migrateBirthControlMethod(raw: Record<string, unknown>): ActivityBirthControlMethod {
  const value = raw.birthControlMethod;
  if (
    typeof value === 'string' &&
    ACTIVITY_BIRTH_CONTROL_METHODS.includes(value as ActivityBirthControlMethod)
  ) {
    return value as ActivityBirthControlMethod;
  }
  return 'none';
}

function migrateSatisfaction(raw: Record<string, unknown>): number | null {
  if (raw.satisfaction == null || raw.satisfaction === '') return null;
  const num = Number(raw.satisfaction);
  return Number.isFinite(num) ? num : null;
}

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
  const protection = migrateProtection(raw, type);

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
    location: String(raw.location ?? ''),
    satisfaction: migrateSatisfaction(raw),
    protection,
    birthControlMethod: migrateBirthControlMethod(raw),
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

export function migrateBirthControlReminder(
  raw: Record<string, unknown>
): BirthControlReminder {
  const methodType = raw.methodType;
  const resolvedMethod =
    typeof methodType === 'string' &&
    BIRTH_CONTROL_METHOD_TYPES.includes(methodType as BirthControlMethodType)
      ? (methodType as BirthControlMethodType)
      : undefined;

  return {
    id: String(raw.id ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    title: raw.title ? String(raw.title) : undefined,
    schedule: raw.schedule ? String(raw.schedule) : undefined,
    nextDue: raw.nextDue ? String(raw.nextDue) : undefined,
    notes: String(raw.notes ?? ''),
    methodType: resolvedMethod,
    startDate: raw.startDate ? String(raw.startDate) : undefined,
    endDate: raw.endDate ? String(raw.endDate) : undefined,
    reminderDate: raw.reminderDate
      ? String(raw.reminderDate)
      : raw.nextDue
        ? String(raw.nextDue)
        : undefined,
    active: typeof raw.active === 'boolean' ? raw.active : true,
  };
}

export function migrateBirthControlReminders(
  items: unknown[]
): BirthControlReminder[] {
  return items.map((item) =>
    migrateBirthControlReminder((item ?? {}) as Record<string, unknown>)
  );
}

export function isLegacyBirthControlReminder(item: BirthControlReminder): boolean {
  return !item.methodType && !!(item.title || item.schedule);
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
  const sexualHealth = {
    ...defaults.sexualHealth,
    ...parsed.sexualHealth,
  };

  return {
    ...defaults,
    ...parsed,
    goals: migrateGoals({ ...defaults.goals, ...parsed.goals }),
    sexualHealth: {
      ...sexualHealth,
      birthControlReminders: migrateBirthControlReminders(
        (parsed.sexualHealth?.birthControlReminders as unknown[]) ??
          defaults.sexualHealth.birthControlReminders
      ),
    },
    settings: { ...defaults.settings, ...parsed.settings },
    activities: migrateActivities((parsed.activities as unknown[]) ?? []),
    partners: migratePartners((parsed.partners as unknown[]) ?? []),
  };
}
