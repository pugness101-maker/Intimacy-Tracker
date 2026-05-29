import { useState } from 'react';
import { RELATIONSHIP_TYPES, type Partner } from '../../types';
import { useApp } from '../../context/AppContext';

interface PartnerFormProps {
  initial?: Partner;
  onDone: () => void;
}

export function PartnerForm({ initial, onDone }: PartnerFormProps) {
  const { addPartner, updatePartner } = useApp();

  const [name, setName] = useState(initial?.name ?? '');
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [relationshipType, setRelationshipType] = useState(
    initial?.relationshipType ?? 'Partner'
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      relationshipType,
      notes: notes.trim(),
    };
    if (initial) {
      updatePartner({ ...initial, ...payload });
    } else {
      addPartner(payload);
    }
    onDone();
  };

  return (
    <form className="form form--compact" onSubmit={handleSubmit}>
      <div className="form-row form-row--2">
        <label>
          Name *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Full name"
          />
        </label>
        <label>
          Nickname
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>

      <label>
        Relationship type
        <select
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value)}
        >
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label>
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional private notes..."
        />
      </label>

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
          {initial ? 'Save' : 'Add'}
        </button>
      </div>
    </form>
  );
}
