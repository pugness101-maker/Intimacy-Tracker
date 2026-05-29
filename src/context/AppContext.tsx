import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createDefaultData } from '../lib/defaults';
import { migrateAppData } from '../lib/migrate';
import { clearData, loadData, saveData } from '../lib/storage';
import { generateId, nowIso } from '../lib/utils';
import type {
  Activity,
  AppData,
  BirthControlReminder,
  DoctorAppointment,
  Goals,
  Partner,
  PeriodNote,
  StiTest,
} from '../types';

interface AppContextValue {
  data: AppData;
  setGoals: (goals: Goals) => void;
  setSettings: (settings: AppData['settings']) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePartner: (partner: Partner) => void;
  deletePartner: (id: string) => void;
  addStiTest: (item: Omit<StiTest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStiTest: (item: StiTest) => void;
  deleteStiTest: (id: string) => void;
  addBirthControl: (
    item: Omit<BirthControlReminder, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateBirthControl: (item: BirthControlReminder) => void;
  deleteBirthControl: (id: string) => void;
  addPeriodNote: (item: Omit<PeriodNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePeriodNote: (item: PeriodNote) => void;
  deletePeriodNote: (id: string) => void;
  addDoctorAppointment: (
    item: Omit<DoctorAppointment, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateDoctorAppointment: (item: DoctorAppointment) => void;
  deleteDoctorAppointment: (id: string) => void;
  importData: (data: AppData) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setGoals = useCallback((goals: Goals) => {
    setData((d) => ({ ...d, goals }));
  }, []);

  const setSettings = useCallback((settings: AppData['settings']) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  const addActivity = useCallback(
    (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
      const ts = nowIso();
      const record: Activity = {
        ...activity,
        id: generateId(),
        createdAt: ts,
        updatedAt: ts,
      };
      setData((d) => ({
        ...d,
        activities: [record, ...d.activities],
      }));
    },
    []
  );

  const updateActivity = useCallback((activity: Activity) => {
    setData((d) => ({
      ...d,
      activities: d.activities.map((a) =>
        a.id === activity.id ? { ...activity, updatedAt: nowIso() } : a
      ),
    }));
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      activities: d.activities.filter((a) => a.id !== id),
    }));
  }, []);

  const addPartner = useCallback(
    (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => {
      const ts = nowIso();
      const record: Partner = {
        ...partner,
        id: generateId(),
        createdAt: ts,
        updatedAt: ts,
      };
      setData((d) => ({ ...d, partners: [...d.partners, record] }));
    },
    []
  );

  const updatePartner = useCallback((partner: Partner) => {
    setData((d) => ({
      ...d,
      partners: d.partners.map((p) =>
        p.id === partner.id ? { ...partner, updatedAt: nowIso() } : p
      ),
    }));
  }, []);

  const deletePartner = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      partners: d.partners.filter((p) => p.id !== id),
      activities: d.activities.map((a) => {
        const partnerIds = a.partnerIds.filter((pid) => pid !== id);
        return {
          ...a,
          partnerIds,
          peopleCount:
            partnerIds.length > 0 ? partnerIds.length : a.peopleCount,
        };
      }),
    }));
  }, []);

  const addStiTest = useCallback(
    (item: Omit<StiTest, 'id' | 'createdAt' | 'updatedAt'>) => {
      const ts = nowIso();
      const record: StiTest = { ...item, id: generateId(), createdAt: ts, updatedAt: ts };
      setData((d) => ({
        ...d,
        sexualHealth: { ...d.sexualHealth, stiTests: [...d.sexualHealth.stiTests, record] },
      }));
    },
    []
  );

  const updateStiTest = useCallback((item: StiTest) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        stiTests: d.sexualHealth.stiTests.map((x) =>
          x.id === item.id ? { ...item, updatedAt: nowIso() } : x
        ),
      },
    }));
  }, []);

  const deleteStiTest = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        stiTests: d.sexualHealth.stiTests.filter((x) => x.id !== id),
      },
    }));
  }, []);

  const addBirthControl = useCallback(
    (item: Omit<BirthControlReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
      const ts = nowIso();
      const record: BirthControlReminder = {
        ...item,
        id: generateId(),
        createdAt: ts,
        updatedAt: ts,
      };
      setData((d) => ({
        ...d,
        sexualHealth: {
          ...d.sexualHealth,
          birthControlReminders: [...d.sexualHealth.birthControlReminders, record],
        },
      }));
    },
    []
  );

  const updateBirthControl = useCallback((item: BirthControlReminder) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        birthControlReminders: d.sexualHealth.birthControlReminders.map((x) =>
          x.id === item.id ? { ...item, updatedAt: nowIso() } : x
        ),
      },
    }));
  }, []);

  const deleteBirthControl = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        birthControlReminders: d.sexualHealth.birthControlReminders.filter(
          (x) => x.id !== id
        ),
      },
    }));
  }, []);

  const addPeriodNote = useCallback(
    (item: Omit<PeriodNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      const ts = nowIso();
      const record: PeriodNote = { ...item, id: generateId(), createdAt: ts, updatedAt: ts };
      setData((d) => ({
        ...d,
        sexualHealth: {
          ...d.sexualHealth,
          periodNotes: [...d.sexualHealth.periodNotes, record],
        },
      }));
    },
    []
  );

  const updatePeriodNote = useCallback((item: PeriodNote) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        periodNotes: d.sexualHealth.periodNotes.map((x) =>
          x.id === item.id ? { ...item, updatedAt: nowIso() } : x
        ),
      },
    }));
  }, []);

  const deletePeriodNote = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        periodNotes: d.sexualHealth.periodNotes.filter((x) => x.id !== id),
      },
    }));
  }, []);

  const addDoctorAppointment = useCallback(
    (item: Omit<DoctorAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const ts = nowIso();
      const record: DoctorAppointment = {
        ...item,
        id: generateId(),
        createdAt: ts,
        updatedAt: ts,
      };
      setData((d) => ({
        ...d,
        sexualHealth: {
          ...d.sexualHealth,
          doctorAppointments: [...d.sexualHealth.doctorAppointments, record],
        },
      }));
    },
    []
  );

  const updateDoctorAppointment = useCallback((item: DoctorAppointment) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        doctorAppointments: d.sexualHealth.doctorAppointments.map((x) =>
          x.id === item.id ? { ...item, updatedAt: nowIso() } : x
        ),
      },
    }));
  }, []);

  const deleteDoctorAppointment = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      sexualHealth: {
        ...d.sexualHealth,
        doctorAppointments: d.sexualHealth.doctorAppointments.filter((x) => x.id !== id),
      },
    }));
  }, []);

  const importData = useCallback((incoming: AppData) => {
    setData(migrateAppData(incoming, createDefaultData()));
  }, []);

  const resetAll = useCallback(() => {
    clearData();
    setData(createDefaultData());
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      setGoals,
      setSettings,
      addActivity,
      updateActivity,
      deleteActivity,
      addPartner,
      updatePartner,
      deletePartner,
      addStiTest,
      updateStiTest,
      deleteStiTest,
      addBirthControl,
      updateBirthControl,
      deleteBirthControl,
      addPeriodNote,
      updatePeriodNote,
      deletePeriodNote,
      addDoctorAppointment,
      updateDoctorAppointment,
      deleteDoctorAppointment,
      importData,
      resetAll,
    }),
    [data]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
