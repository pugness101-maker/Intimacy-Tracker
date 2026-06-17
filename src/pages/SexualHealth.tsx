import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { getCondomUsageStats } from '../lib/analytics';
import {
  getStiDashboardStats,
  getStiResultLines,
  hasStructuredResults,
} from '../lib/sti';
import { formatDate } from '../lib/utils';
import {
  STI_RESULT_LABELS,
  STI_RESULT_STATUSES,
  STI_TEST_LABELS,
  STI_TEST_TYPES,
  type BirthControlReminder,
  type DoctorAppointment,
  type PeriodNote,
  type StiResultStatus,
  type StiTest,
  type StiTestType,
} from '../types';

type HealthTab = 'sti' | 'birth' | 'period' | 'doctor';

export function SexualHealth() {
  const { data } = useApp();
  const [tab, setTab] = useState<HealthTab>('sti');
  const condom = getCondomUsageStats(data.activities);

  const tabs: { id: HealthTab; label: string }[] = [
    { id: 'sti', label: 'STI tests' },
    { id: 'birth', label: 'Birth control' },
    { id: 'period', label: 'Cycle' },
    { id: 'doctor', label: 'Appointments' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Sexual Health</h1>
          <p className="page-header__sub">Tests, reminders, and wellness notes</p>
        </div>
      </header>

      <Card className="condom-summary">
        <h3>Condom usage (from activity log)</h3>
        <div className="condom-summary__stats">
          <span>Yes: {condom.yes}</span>
          <span>No: {condom.no}</span>
          <span>N/A: {condom.na}</span>
          {condom.percentProtected !== null && (
            <span className="condom-summary__highlight">
              {condom.percentProtected}% protected when applicable
            </span>
          )}
        </div>
      </Card>

      <div className="sub-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`sub-tabs__item ${tab === t.id ? 'sub-tabs__item--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sti' && <StiSection />}
      {tab === 'birth' && <BirthControlSection />}
      {tab === 'period' && <PeriodSection />}
      {tab === 'doctor' && <DoctorSection />}
    </div>
  );
}

function StiSection() {
  const { data, addStiTest, updateStiTest, deleteStiTest } = useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<StiTest | null>(null);
  const stats = getStiDashboardStats(data.sexualHealth.stiTests);

  return (
    <>
      <StiStatsPanel stats={stats} />
      <HealthList
        emptyIcon="✚"
        emptyTitle="No STI tests logged"
        emptyDesc="Record test dates and results for your private health timeline."
        items={data.sexualHealth.stiTests}
        onAdd={() => setOpen(true)}
        renderItem={(item) => (
          <StiTestCard
            key={item.id}
            test={item}
            onEdit={() => setEdit(item)}
            onDelete={() => confirmDelete(() => deleteStiTest(item.id))}
          />
        )}
        modal={
          <>
            <Modal open={open} onClose={() => setOpen(false)} title="Add STI test">
              <StiForm onSave={addStiTest} onDone={() => setOpen(false)} />
            </Modal>
            <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit STI test">
              {edit && (
                <StiForm
                  initial={edit}
                  onSave={(v) => updateStiTest({ ...edit, ...v })}
                  onDone={() => setEdit(null)}
                />
              )}
            </Modal>
          </>
        }
      />
    </>
  );
}

function StiStatsPanel({ stats }: { stats: ReturnType<typeof getStiDashboardStats> }) {
  return (
    <div className="stat-grid stat-grid--sti">
      <Card className="stat-card">
        <span className="stat-card__label">Last STI test</span>
        <span className="stat-card__value stat-card__value--sm">
          {stats.lastTestDate ? formatDate(stats.lastTestDate) : '—'}
        </span>
      </Card>
      <Card className="stat-card">
        <span className="stat-card__label">Last full panel</span>
        <span className="stat-card__value stat-card__value--sm">
          {stats.lastFullPanelDate ? formatDate(stats.lastFullPanelDate) : '—'}
        </span>
      </Card>
      <Card className="stat-card">
        <span className="stat-card__label">Active positives</span>
        <span className="stat-card__value">{stats.activePositiveCount}</span>
        {stats.activePositives.length > 0 && (
          <span className="stat-card__hint">
            {stats.activePositives.map((p) => p.label).join(', ')}
          </span>
        )}
      </Card>
      <Card className="stat-card">
        <span className="stat-card__label">Days since last test</span>
        <span className="stat-card__value">
          {stats.daysSinceLastTest !== null ? stats.daysSinceLastTest : '—'}
        </span>
      </Card>
      <Card className="stat-card">
        <span className="stat-card__label">Retest due</span>
        <span className="stat-card__value stat-card__value--sm">
          {stats.retestDueDate ? formatDate(stats.retestDueDate) : '—'}
        </span>
      </Card>
    </div>
  );
}

function StiTestCard({
  test,
  onEdit,
  onDelete,
}: {
  test: StiTest;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const resultLines = getStiResultLines(test);
  const isLegacy = test.results && !hasStructuredResults(test);
  const hasTreatment =
    test.medication ||
    test.treatmentStartDate ||
    test.treatmentEndDate ||
    test.followUpDate;

  return (
    <Card className="health-item">
      <h3>{formatDate(test.date)}</h3>
      {test.provider && <p className="text-muted">{test.provider}</p>}
      {resultLines.length > 0 && (
        <ul className="sti-results-list">
          {resultLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {isLegacy && (
        <div className="sti-legacy-results">
          <span className="sti-legacy-results__label">Legacy Results</span>
          <p>{test.results}</p>
        </div>
      )}
      {hasTreatment && (
        <div className="sti-treatment-summary">
          {test.medication && <p>Medication: {test.medication}</p>}
          {(test.treatmentStartDate || test.treatmentEndDate) && (
            <p className="text-muted">
              Treatment:{' '}
              {test.treatmentStartDate ? formatDate(test.treatmentStartDate) : '—'}
              {' – '}
              {test.treatmentEndDate ? formatDate(test.treatmentEndDate) : '—'}
            </p>
          )}
          {test.followUpDate && (
            <p className="text-muted">Follow-up: {formatDate(test.followUpDate)}</p>
          )}
        </div>
      )}
      {test.notes && <p>{test.notes}</p>}
      <div className="activity-card__actions">
        <button type="button" className="btn btn--sm btn--ghost" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="btn btn--sm btn--danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </Card>
  );
}

function BirthControlSection() {
  const { data, addBirthControl, updateBirthControl, deleteBirthControl } = useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BirthControlReminder | null>(null);

  return (
    <HealthList
      emptyIcon="◇"
      emptyTitle="No birth control reminders"
      emptyDesc="Set reminders for pills, patches, or other methods."
      items={data.sexualHealth.birthControlReminders}
      onAdd={() => setOpen(true)}
      renderItem={(item) => (
        <HealthItemCard
          key={item.id}
          title={item.title}
          subtitle={item.schedule}
          body={
            item.nextDue
              ? `Next due: ${formatDate(item.nextDue)}${item.notes ? ` · ${item.notes}` : ''}`
              : item.notes
          }
          onEdit={() => setEdit(item)}
          onDelete={() => confirmDelete(() => deleteBirthControl(item.id))}
        />
      )}
      modal={
        <>
          <Modal open={open} onClose={() => setOpen(false)} title="Add reminder">
            <BirthForm onSave={addBirthControl} onDone={() => setOpen(false)} />
          </Modal>
          <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit reminder">
            {edit && (
              <BirthForm
                initial={edit}
                onSave={(v) => updateBirthControl({ ...edit, ...v })}
                onDone={() => setEdit(null)}
              />
            )}
          </Modal>
        </>
      }
    />
  );
}

function PeriodSection() {
  const { data, addPeriodNote, updatePeriodNote, deletePeriodNote } = useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<PeriodNote | null>(null);

  return (
    <HealthList
      emptyIcon="◐"
      emptyTitle="No cycle notes"
      emptyDesc="Track period dates, symptoms, and fertility notes privately."
      items={data.sexualHealth.periodNotes}
      onAdd={() => setOpen(true)}
      renderItem={(item) => (
        <HealthItemCard
          key={item.id}
          title={formatDate(item.date)}
          subtitle={item.cycleDay ? `Cycle day ${item.cycleDay}` : undefined}
          body={[item.symptoms, item.fertilityNotes, item.notes].filter(Boolean).join(' · ')}
          onEdit={() => setEdit(item)}
          onDelete={() => confirmDelete(() => deletePeriodNote(item.id))}
        />
      )}
      modal={
        <>
          <Modal open={open} onClose={() => setOpen(false)} title="Add cycle note">
            <PeriodForm onSave={addPeriodNote} onDone={() => setOpen(false)} />
          </Modal>
          <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit cycle note">
            {edit && (
              <PeriodForm
                initial={edit}
                onSave={(v) => updatePeriodNote({ ...edit, ...v })}
                onDone={() => setEdit(null)}
              />
            )}
          </Modal>
        </>
      }
    />
  );
}

function DoctorSection() {
  const { data, addDoctorAppointment, updateDoctorAppointment, deleteDoctorAppointment } =
    useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DoctorAppointment | null>(null);

  return (
    <HealthList
      emptyIcon="✚"
      emptyTitle="No appointments logged"
      emptyDesc="Keep doctor visit dates and notes in one private place."
      items={data.sexualHealth.doctorAppointments}
      onAdd={() => setOpen(true)}
      renderItem={(item) => (
        <HealthItemCard
          key={item.id}
          title={formatDate(item.date)}
          subtitle={[item.provider, item.reason].filter(Boolean).join(' · ')}
          body={item.notes}
          onEdit={() => setEdit(item)}
          onDelete={() => confirmDelete(() => deleteDoctorAppointment(item.id))}
        />
      )}
      modal={
        <>
          <Modal open={open} onClose={() => setOpen(false)} title="Add appointment">
            <DoctorForm onSave={addDoctorAppointment} onDone={() => setOpen(false)} />
          </Modal>
          <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit appointment">
            {edit && (
              <DoctorForm
                initial={edit}
                onSave={(v) => updateDoctorAppointment({ ...edit, ...v })}
                onDone={() => setEdit(null)}
              />
            )}
          </Modal>
        </>
      }
    />
  );
}

function HealthList<T extends { id: string; date?: string }>({
  emptyIcon,
  emptyTitle,
  emptyDesc,
  items,
  onAdd,
  renderItem,
  modal,
}: {
  emptyIcon: string;
  emptyTitle: string;
  emptyDesc: string;
  items: T[];
  onAdd: () => void;
  renderItem: (item: T) => React.ReactNode;
  modal: React.ReactNode;
}) {
  const sorted = [...items].sort((a, b) => {
    const da = 'date' in a && a.date ? a.date : '';
    const db = 'date' in b && b.date ? b.date : '';
    return db.localeCompare(da);
  });

  return (
    <>
      <div className="section-actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={onAdd}>
          + Add
        </button>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDesc} />
      ) : (
        <div className="card-list">{sorted.map(renderItem)}</div>
      )}
      {modal}
    </>
  );
}

function HealthItemCard({
  title,
  subtitle,
  body,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  body?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="health-item">
      <h3>{title}</h3>
      {subtitle && <p className="text-muted">{subtitle}</p>}
      {body && <p>{body}</p>}
      <div className="activity-card__actions">
        <button type="button" className="btn btn--sm btn--ghost" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="btn btn--sm btn--danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </Card>
  );
}

function confirmDelete(fn: () => void) {
  if (confirm('Delete this record?')) fn();
}

function StiForm({
  initial,
  onSave,
  onDone,
}: {
  initial?: StiTest;
  onSave: (v: Omit<StiTest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [testsPerformed, setTestsPerformed] = useState<StiTestType[]>(
    initial?.testsPerformed ?? []
  );
  const [testResults, setTestResults] = useState<
    Partial<Record<StiTestType, StiResultStatus>>
  >(initial?.testResults ?? {});
  const [otherTestLabel, setOtherTestLabel] = useState(initial?.otherTestLabel ?? '');
  const [legacyResults, setLegacyResults] = useState(initial?.results ?? '');
  const [medication, setMedication] = useState(initial?.medication ?? '');
  const [treatmentStartDate, setTreatmentStartDate] = useState(
    initial?.treatmentStartDate ?? ''
  );
  const [treatmentEndDate, setTreatmentEndDate] = useState(initial?.treatmentEndDate ?? '');
  const [followUpDate, setFollowUpDate] = useState(initial?.followUpDate ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const showLegacyField = !!initial?.results && !hasStructuredResults(initial);
  const showOtherLabel = testsPerformed.includes('other');

  const toggleTest = (test: StiTestType) => {
    setTestsPerformed((prev) => {
      if (prev.includes(test)) {
        const next = prev.filter((t) => t !== test);
        setTestResults((results) => {
          const { [test]: _, ...rest } = results;
          return rest;
        });
        return next;
      }
      return [...prev, test];
    });
  };

  const setResult = (test: StiTestType, result: StiResultStatus) => {
    setTestResults((prev) => ({ ...prev, [test]: result }));
  };

  return (
    <HealthForm
      onSubmit={() => {
        const hasStructured = testsPerformed.length > 0;
        onSave({
          date,
          provider: provider || undefined,
          results: showLegacyField && legacyResults ? legacyResults : undefined,
          notes,
          testsPerformed: hasStructured ? testsPerformed : undefined,
          testResults: hasStructured ? testResults : undefined,
          otherTestLabel: showOtherLabel && otherTestLabel ? otherTestLabel : undefined,
          medication: medication || undefined,
          treatmentStartDate: treatmentStartDate || undefined,
          treatmentEndDate: treatmentEndDate || undefined,
          followUpDate: followUpDate || undefined,
        });
        onDone();
      }}
      onCancel={onDone}
    >
      <label>
        Date{' '}
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label>
        Provider <input value={provider} onChange={(e) => setProvider(e.target.value)} />
      </label>

      <fieldset className="fieldset partner-multi">
        <legend>Tests performed</legend>
        <div className="partner-multi__list sti-checklist">
          {STI_TEST_TYPES.map((test) => (
            <label key={test} className="partner-multi__item">
              <input
                type="checkbox"
                checked={testsPerformed.includes(test)}
                onChange={() => toggleTest(test)}
              />
              <span>{STI_TEST_LABELS[test]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showOtherLabel && (
        <label>
          Other test name{' '}
          <input
            value={otherTestLabel}
            onChange={(e) => setOtherTestLabel(e.target.value)}
            placeholder="Specify other test"
          />
        </label>
      )}

      {testsPerformed.length > 0 && (
        <fieldset className="fieldset">
          <legend>Results</legend>
          <div className="sti-result-fields">
            {testsPerformed.map((test) => (
              <div key={test} className="sti-result-row">
                <span className="sti-result-row__label">
                  {test === 'other' && otherTestLabel
                    ? otherTestLabel
                    : STI_TEST_LABELS[test]}
                </span>
                <div className="radio-group sti-result-row__options">
                  {STI_RESULT_STATUSES.map((status) => (
                    <label key={status} className="radio-pill radio-pill--sm">
                      <input
                        type="radio"
                        name={`sti-result-${test}`}
                        value={status}
                        checked={testResults[test] === status}
                        onChange={() => setResult(test, status)}
                      />
                      {STI_RESULT_LABELS[status]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="fieldset">
        <legend>Treatment</legend>
        <label>
          Medication{' '}
          <input
            value={medication}
            onChange={(e) => setMedication(e.target.value)}
            placeholder="e.g. Doxycycline"
          />
        </label>
        <div className="form-row form-row--2">
          <label>
            Treatment start{' '}
            <input
              type="date"
              value={treatmentStartDate}
              onChange={(e) => setTreatmentStartDate(e.target.value)}
            />
          </label>
          <label>
            Treatment end{' '}
            <input
              type="date"
              value={treatmentEndDate}
              onChange={(e) => setTreatmentEndDate(e.target.value)}
            />
          </label>
        </div>
        <label>
          Follow-up / retest date{' '}
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </label>
      </fieldset>

      {showLegacyField && (
        <label>
          Legacy Results{' '}
          <textarea
            value={legacyResults}
            onChange={(e) => setLegacyResults(e.target.value)}
            rows={2}
          />
        </label>
      )}

      <label>
        Notes <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>
    </HealthForm>
  );
}

function BirthForm({
  initial,
  onSave,
  onDone,
}: {
  initial?: BirthControlReminder;
  onSave: (v: Omit<BirthControlReminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [schedule, setSchedule] = useState(initial?.schedule ?? '');
  const [nextDue, setNextDue] = useState(initial?.nextDue ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <HealthForm
      onSubmit={() => {
        onSave({
          title,
          schedule,
          nextDue: nextDue || undefined,
          notes,
        });
        onDone();
      }}
      onCancel={onDone}
    >
      <label>Title <input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
      <label>Schedule <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Daily at 9am" /></label>
      <label>Next due <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></label>
      <label>Notes <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></label>
    </HealthForm>
  );
}

function PeriodForm({
  initial,
  onSave,
  onDone,
}: {
  initial?: PeriodNote;
  onSave: (v: Omit<PeriodNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [cycleDay, setCycleDay] = useState(initial?.cycleDay?.toString() ?? '');
  const [symptoms, setSymptoms] = useState(initial?.symptoms ?? '');
  const [fertilityNotes, setFertilityNotes] = useState(initial?.fertilityNotes ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <HealthForm
      onSubmit={() => {
        onSave({
          date,
          cycleDay: cycleDay ? Number(cycleDay) : undefined,
          symptoms: symptoms || undefined,
          fertilityNotes: fertilityNotes || undefined,
          notes,
        });
        onDone();
      }}
      onCancel={onDone}
    >
      <label>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
      <label>Cycle day <input type="number" min={1} max={45} value={cycleDay} onChange={(e) => setCycleDay(e.target.value)} /></label>
      <label>Symptoms <input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} /></label>
      <label>Fertility notes <input value={fertilityNotes} onChange={(e) => setFertilityNotes(e.target.value)} /></label>
      <label>Notes <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></label>
    </HealthForm>
  );
}

function DoctorForm({
  initial,
  onSave,
  onDone,
}: {
  initial?: DoctorAppointment;
  onSave: (v: Omit<DoctorAppointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <HealthForm
      onSubmit={() => {
        onSave({
          date,
          provider: provider || undefined,
          reason: reason || undefined,
          notes,
        });
        onDone();
      }}
      onCancel={onDone}
    >
      <label>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
      <label>Provider <input value={provider} onChange={(e) => setProvider(e.target.value)} /></label>
      <label>Reason <input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <label>Notes <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></label>
    </HealthForm>
  );
}

function HealthForm({
  children,
  onSubmit,
  onCancel,
}: {
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Save
        </button>
      </div>
    </form>
  );
}
