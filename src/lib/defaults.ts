import { DATA_VERSION, type AppData, type Goals } from '../types';

export const defaultGoals = (): Goals => ({
  frequency: {
    enabled: false,
    count: 4,
    period: 'month',
    activityTypes: ['partner_sex', 'masturbation'],
  },
  noPorn: {
    enabled: false,
    startDate: new Date().toISOString().slice(0, 10),
    streakDays: 0,
  },
  soloLimit: {
    enabled: false,
    maxPerWeek: 3,
  },
  safeSex: {
    enabled: false,
    targetPercent: 100,
  },
  connection: {
    enabled: false,
    description: 'Quality time with partner',
    targetPerMonth: 8,
  },
});

export const createDefaultData = (): AppData => ({
  version: DATA_VERSION,
  activities: [],
  partners: [],
  goals: defaultGoals(),
  sexualHealth: {
    stiTests: [],
    birthControlReminders: [],
    periodNotes: [],
    doctorAppointments: [],
  },
  settings: {
    pinEnabled: false,
  },
  updatedAt: new Date().toISOString(),
});
