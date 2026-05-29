import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { getCondomUsageStats } from '../lib/analytics';
import { formatDate } from '../lib/utils';
import type {
  BirthControlReminder,
  DoctorAppointment,
  PeriodNote,
  StiTest,
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

  return (
    <HealthList
      emptyIcon="✚"
      emptyTitle="No STI tests logged"
      emptyDesc="Record test dates and results for your private health timeline."
      items={data.sexualHealth.stiTests}
      onAdd={() => setOpen(true)}
      renderItem={(item) => (
        <HealthItemCard
          key={item.id}
          title={formatDate(item.date)}
          subtitle={item.provider}
          body={item.results || item.notes}
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
  const [results, setResults] = useState(initial?.results ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  return (
    <HealthForm
      onSubmit={() => {
        onSave({ date, provider: provider || undefined, results: results || undefined, notes });
        onDone();
      }}
      onCancel={onDone}
    >
      <label>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
      <label>Provider <input value={provider} onChange={(e) => setProvider(e.target.value)} /></label>
      <label>Results <input value={results} onChange={(e) => setResults(e.target.value)} placeholder="Negative, pending..." /></label>
      <label>Notes <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></label>
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
