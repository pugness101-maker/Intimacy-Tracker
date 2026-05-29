import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PartnerForm } from '../components/forms/PartnerForm';
import type { Partner } from '../types';
import { formatDate, getPartnerLastIntimacy } from '../lib/utils';

export function Partners() {
  const { data, deletePartner } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);

  const handleDelete = (p: Partner) => {
    if (confirm(`Remove ${p.nickname || p.name}? Activity logs will keep but lose the partner link.`)) {
      deletePartner(p.id);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Partners</h1>
          <p className="page-header__sub">People linked to your activity log</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
          + Add
        </button>
      </header>

      {data.partners.length === 0 ? (
        <EmptyState
          icon="♡"
          title="No partners saved"
          description="Add partners to link activities and track connection history privately."
          action={
            <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
              Add partner
            </button>
          }
        />
      ) : (
        <div className="card-list">
          {data.partners.map((p) => {
            const last = getPartnerLastIntimacy(p.id, data.activities);
            return (
              <Card key={p.id} className="partner-card">
                <div className="partner-card__header">
                  <div>
                    <h3>{p.nickname || p.name}</h3>
                    {p.nickname && <span className="text-muted">{p.name}</span>}
                  </div>
                  <span className="badge badge--soft">{p.relationshipType}</span>
                </div>
                <dl className="partner-card__meta partner-card__meta--single">
                  <div>
                    <dt>Last intimacy</dt>
                    <dd>{last ? formatDate(last) : '—'}</dd>
                  </div>
                </dl>
                {p.notes && (
                  <p className="partner-card__notes">{p.notes}</p>
                )}
                <div className="activity-card__actions">
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setEditing(p)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--danger"
                    onClick={() => handleDelete(p)}
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add partner">
        <PartnerForm onDone={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit partner">
        {editing && <PartnerForm initial={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
