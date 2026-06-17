import {
  ACTIVITY_BIRTH_CONTROL_LABELS,
  PROTECTION_LABELS,
  type Activity,
  type ActivityBirthControlMethod,
  type ProtectionStatus,
} from '../types';

export function formatSatisfactionText(satisfaction: number | null): string {
  if (satisfaction == null) return 'Satisfaction: Not recorded';
  return `Satisfaction: ${satisfaction}/10`;
}

export function formatProtectionText(protection: ProtectionStatus): string {
  return `Protection: ${PROTECTION_LABELS[protection]}`;
}

export function formatBirthControlMethodText(
  method: ActivityBirthControlMethod
): string {
  return `Birth control: ${ACTIVITY_BIRTH_CONTROL_LABELS[method]}`;
}

export function getActivityCardDetails(activity: Activity): string[] {
  const lines: string[] = [];
  if (activity.location.trim()) {
    lines.push(`Location: ${activity.location.trim()}`);
  }
  lines.push(formatProtectionText(activity.protection));
  lines.push(formatBirthControlMethodText(activity.birthControlMethod));
  lines.push(formatSatisfactionText(activity.satisfaction));
  return lines;
}
