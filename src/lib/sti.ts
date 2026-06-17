import {
  FULL_PANEL_STI_TESTS,
  STI_RESULT_LABELS,
  STI_TEST_LABELS,
  type StiResultStatus,
  type StiTest,
  type StiTestType,
} from '../types';

export function hasStructuredResults(test: StiTest): boolean {
  return (
    (test.testsPerformed?.length ?? 0) > 0 ||
    Object.keys(test.testResults ?? {}).length > 0
  );
}

export function getStiTestLabel(test: StiTestType, otherLabel?: string): string {
  if (test === 'other' && otherLabel?.trim()) return otherLabel.trim();
  return STI_TEST_LABELS[test];
}

export function getStiCardLabel(test: StiTestType): string {
  if (test === 'hiv') return 'HIV';
  return STI_TEST_LABELS[test];
}

export function formatStiResultLine(
  test: StiTestType,
  result: StiResultStatus,
  otherLabel?: string
): string {
  const label = test === 'other' ? getStiTestLabel(test, otherLabel) : getStiCardLabel(test);
  return `${label}: ${STI_RESULT_LABELS[result]}`;
}

export function getStiResultLines(test: StiTest): string[] {
  if (!test.testsPerformed?.length) return [];
  return test.testsPerformed
    .map((t) => {
      const result = test.testResults?.[t];
      if (!result) return null;
      return formatStiResultLine(t, result, test.otherTestLabel);
    })
    .filter((line): line is string => line !== null);
}

export function isFullPanelTest(test: StiTest): boolean {
  const performed = new Set(test.testsPerformed ?? []);
  return FULL_PANEL_STI_TESTS.every((t) => performed.has(t));
}

function daysBetween(from: string, to: Date): number {
  const start = new Date(from + 'T12:00:00');
  const end = new Date(to);
  end.setHours(12, 0, 0, 0);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export interface StiDashboardStats {
  lastTestDate: string | null;
  lastFullPanelDate: string | null;
  activePositiveCount: number;
  activePositives: { test: StiTestType; label: string }[];
  daysSinceLastTest: number | null;
  retestDueDate: string | null;
}

export function getStiDashboardStats(
  tests: StiTest[],
  ref = new Date()
): StiDashboardStats {
  const sorted = [...tests].sort((a, b) => b.date.localeCompare(a.date));
  const lastTest = sorted[0] ?? null;
  const lastFullPanel =
    sorted.find((t) => isFullPanelTest(t)) ?? null;

  const latestByType = new Map<StiTestType, { date: string; result: StiResultStatus }>();
  for (const test of sorted) {
    for (const sti of test.testsPerformed ?? []) {
      const result = test.testResults?.[sti];
      if (!result || latestByType.has(sti)) continue;
      latestByType.set(sti, { date: test.date, result });
    }
  }

  const activePositives = [...latestByType.entries()]
    .filter(([, v]) => v.result === 'positive')
    .map(([test]) => ({
      test,
      label: getStiCardLabel(test),
    }));

  const retestDueDate =
    sorted
      .filter((t) => t.followUpDate)
      .sort((a, b) => (b.followUpDate ?? '').localeCompare(a.followUpDate ?? ''))[0]
      ?.followUpDate ?? null;

  return {
    lastTestDate: lastTest?.date ?? null,
    lastFullPanelDate: lastFullPanel?.date ?? null,
    activePositiveCount: activePositives.length,
    activePositives,
    daysSinceLastTest: lastTest ? daysBetween(lastTest.date, ref) : null,
    retestDueDate,
  };
}
