import { useEffect, useState } from 'react';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_TYPE_LABELS,
  isPartnerActivity,
  supportsPartnerLink,
  type Activity,
  type ActivityType,
  type ProtectionStatus,
} from '../../types';
import {
  calculateDurationMinutes,
  formatDuration,
  normalizeTime,
  resolveActivityPeopleCount,
} from '../../lib/utils';
import { useApp } from '../../context/AppContext';

interface ActivityFormProps {
  initial?: Activity;
  onDone: () => void;
}

export function ActivityForm({ initial, onDone }: ActivityFormProps) {
  const { data, addActivity, updateActivity } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(initial?.date ?? today);
  const [startTime, setStartTime] = useState(initial?.startTime ?? '');
  const [endTime, setEndTime] = useState(initial?.endTime ?? '');
  const [type, setType] = useState<ActivityType>(
    initial?.type ?? 'partner_sex'
  );
  const [partnerIds, setPartnerIds] = useState<string[]>(
    initial?.partnerIds ?? []
  );
  const [manualPeopleCount, setManualPeopleCount] = useState<number>(
    initial?.partnerIds.length === 0 && initial?.peopleCount
      ? initial.peopleCount
      : 2
  );
  const [satisfaction, setSatisfaction] = useState(initial?.satisfaction ?? 7);
  const [protection, setProtection] = useState<ProtectionStatus>(
    initial?.protection ?? 'na'
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const duration = calculateDurationMinutes(startTime, endTime);
  const showPartnerLink = supportsPartnerLink(type);
  const showProtection = isPartnerActivity(type);
  const autoPeopleCount = partnerIds.length;

  useEffect(() => {
    if (!showPartnerLink) {
      setPartnerIds([]);
    }
    if (!showProtection) {
      setProtection('na');
    }
  }, [showPartnerLink, showProtection]);

  const togglePartner = (id: string) => {
    setPartnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);
    const ids = showPartnerLink ? partnerIds : [];
    const peopleCount = resolveActivityPeopleCount(ids, manualPeopleCount);

    const payload = {
      date,
      startTime: start,
      endTime: end,
      durationMinutes: calculateDurationMinutes(start, end),
      type,
      partnerIds: ids,
      peopleCount: showPartnerLink ? peopleCount : null,
      satisfaction,
      protection: showProtection ? protection : ('na' as ProtectionStatus),
      notes,
    };
    if (initial) {
      updateActivity({ ...initial, ...payload });
    } else {
      addActivity(payload);
    }
    onDone();
  };

  return (
    <form className="form form--compact" onSubmit={handleSubmit}>
      <label>
        Date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>

      <div className="form-row form-row--2">
        <label>
          Start time <span className="label-optional">Optional</span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label>
          End time <span className="label-optional">Optional</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
      </div>

      <p className="form-hint">Duration: {formatDuration(duration)}</p>

      <label>
        Activity type
        <select value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
          {(
            Object.entries(ACTIVITY_CATEGORIES) as [
              keyof typeof ACTIVITY_CATEGORIES,
              (typeof ACTIVITY_CATEGORIES)[keyof typeof ACTIVITY_CATEGORIES],
            ][]
          ).map(([key, group]) => (
            <optgroup key={key} label={group.label}>
              {group.types.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {showPartnerLink && data.partners.length > 0 && (
        <fieldset className="fieldset partner-multi">
          <legend>Partners (select all that apply)</legend>
          <div className="partner-multi__list">
            {data.partners.map((p) => (
              <label key={p.id} className="partner-multi__item">
                <input
                  type="checkbox"
                  checked={partnerIds.includes(p.id)}
                  onChange={() => togglePartner(p.id)}
                />
                <span>{p.nickname || p.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {showPartnerLink && (
        <div className="people-count-field">
          {autoPeopleCount > 0 ? (
            <p className="form-hint">
              People count: <strong>{autoPeopleCount}</strong> (from selected
              partners)
            </p>
          ) : (
            <label>
              People count
              <input
                type="number"
                min={1}
                max={20}
                value={manualPeopleCount}
                onChange={(e) =>
                  setManualPeopleCount(Math.max(1, Number(e.target.value)))
                }
              />
              <span className="label-optional">When no partners are selected</span>
            </label>
          )}
        </div>
      )}

      {showProtection && (
        <fieldset className="fieldset fieldset--inline">
          <legend>Protection used</legend>
          <div className="radio-group">
            {(['yes', 'no', 'na'] as ProtectionStatus[]).map((v) => (
              <label key={v} className="radio-pill">
                <input
                  type="radio"
                  name="protection"
                  value={v}
                  checked={protection === v}
                  onChange={() => setProtection(v)}
                />
                {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'N/A'}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label>
        Satisfaction ({satisfaction}/10)
        <input
          type="range"
          min={1}
          max={10}
          value={satisfaction}
          onChange={(e) => setSatisfaction(Number(e.target.value))}
        />
      </label>

      <label>
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional..."
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {initial ? 'Save' : 'Add'}
        </button>
      </div>
    </form>
  );
}
