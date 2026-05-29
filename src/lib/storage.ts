import { createDefaultData } from './defaults';
import { migrateAppData } from './migrate';
import { STORAGE_KEY, type AppData } from '../types';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return mergeWithDefaults(parsed);
  } catch {
    return createDefaultData();
  }
}

function mergeWithDefaults(parsed: Partial<AppData>): AppData {
  return migrateAppData(parsed, createDefaultData());
}

export function saveData(data: AppData): void {
  const toSave: AppData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
