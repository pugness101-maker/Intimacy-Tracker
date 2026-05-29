/** Storage key for local persistence */
export const STORAGE_KEY = 'intimacy-tracker-v1';

export const DATA_VERSION = 1;

export type ActivityType =
  | 'partner_sex'
  | 'masturbation'
  | 'oral_received'
  | 'oral_given'
  | 'hand_stimulation'
  | 'fingering'
  | 'mutual_play'
  | 'makeout'
  | 'cuddling'
  | 'date_night'
  | 'other';

export type ActivityCategory = 'partner' | 'solo' | 'relationship' | 'other';

export type ProtectionStatus = 'yes' | 'no' | 'na';

export type GoalPeriod = 'week' | 'month';

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity extends BaseRecord {
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  type: ActivityType;
  partnerIds: string[];
  peopleCount: number | null;
  satisfaction: number;
  protection: ProtectionStatus;
  notes: string;
}

export interface Partner extends BaseRecord {
  name: string;
  nickname?: string;
  relationshipType: string;
  notes: string;
}

export interface FrequencyGoal {
  enabled: boolean;
  count: number;
  period: GoalPeriod;
  activityTypes: ActivityType[];
}

export interface NoPornChallenge {
  enabled: boolean;
  startDate: string;
  streakDays: number;
}

export interface SoloLimitGoal {
  enabled: boolean;
  maxPerWeek: number;
}

export interface SafeSexGoal {
  enabled: boolean;
  targetPercent: number;
}

export interface ConnectionGoal {
  enabled: boolean;
  description: string;
  targetPerMonth: number;
}

export interface Goals {
  frequency: FrequencyGoal;
  noPorn: NoPornChallenge;
  soloLimit: SoloLimitGoal;
  safeSex: SafeSexGoal;
  connection: ConnectionGoal;
}

export interface StiTest extends BaseRecord {
  date: string;
  provider?: string;
  results?: string;
  notes: string;
}

export interface BirthControlReminder extends BaseRecord {
  title: string;
  schedule: string;
  nextDue?: string;
  notes: string;
}

export interface PeriodNote extends BaseRecord {
  date: string;
  cycleDay?: number;
  symptoms?: string;
  fertilityNotes?: string;
  notes: string;
}

export interface DoctorAppointment extends BaseRecord {
  date: string;
  provider?: string;
  reason?: string;
  notes: string;
}

export interface SexualHealth {
  stiTests: StiTest[];
  birthControlReminders: BirthControlReminder[];
  periodNotes: PeriodNote[];
  doctorAppointments: DoctorAppointment[];
}

export interface AppSettings {
  pinEnabled: boolean;
  pinHash?: string;
}

export interface AppData {
  version: number;
  activities: Activity[];
  partners: Partner[];
  goals: Goals;
  sexualHealth: SexualHealth;
  settings: AppSettings;
  updatedAt: string;
}

export type TabId =
  | 'dashboard'
  | 'activity'
  | 'partners'
  | 'goals'
  | 'health'
  | 'analytics'
  | 'settings';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  partner_sex: 'Partner Sex',
  masturbation: 'Masturbation',
  oral_received: 'Oral (Received)',
  oral_given: 'Oral (Given)',
  hand_stimulation: 'Hand Stimulation',
  fingering: 'Fingering',
  mutual_play: 'Mutual Play',
  makeout: 'Makeout',
  cuddling: 'Cuddling',
  date_night: 'Date Night',
  other: 'Other',
};

export const ACTIVITY_CATEGORIES: Record<
  ActivityCategory,
  { label: string; types: ActivityType[] }
> = {
  partner: {
    label: 'Partner Activities',
    types: [
      'partner_sex',
      'oral_received',
      'oral_given',
      'hand_stimulation',
      'fingering',
      'mutual_play',
    ],
  },
  solo: {
    label: 'Solo Activities',
    types: ['masturbation'],
  },
  relationship: {
    label: 'Relationship Activities',
    types: ['makeout', 'cuddling', 'date_night'],
  },
  other: {
    label: 'Other',
    types: ['other'],
  },
};

export const ALL_ACTIVITY_TYPES: ActivityType[] = Object.values(
  ACTIVITY_CATEGORIES
).flatMap((c) => c.types);

export function getActivityCategory(type: ActivityType): ActivityCategory {
  for (const [cat, { types }] of Object.entries(ACTIVITY_CATEGORIES) as [
    ActivityCategory,
    { label: string; types: ActivityType[] },
  ][]) {
    if (types.includes(type)) return cat;
  }
  return 'other';
}

export function isPartnerActivity(type: ActivityType): boolean {
  return getActivityCategory(type) === 'partner';
}

/** Activity types that can link one or more partners (excludes solo/masturbation). */
export function supportsPartnerLink(type: ActivityType): boolean {
  return type !== 'masturbation';
}

export const RELATIONSHIP_TYPES = [
  'Partner',
  'Dating',
  'Casual',
  'Friend',
  'Ex',
  'Other',
];
