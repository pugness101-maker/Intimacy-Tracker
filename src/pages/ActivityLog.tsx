import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ActivityForm } from '../components/forms/ActivityForm';
import {
  PartnerChipList,
  activityInvolvesPartner,
  getPartnerLinkLabel,
} from '../components/activity/PartnerChips';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_TYPE_LABELS,
  isPartnerActivity,
  type Activity,
  type ActivityCategory,
} from '../types';
import {
  activityMatchesCategory,
  formatActivitySchedule,
  formatDateNumeric,
} from '../lib/utils';
import {
  ACTIVITY_SORT_LABELS,
  sortActivities,
  type ActivitySortOption,
} from '../lib/sorting';

type CategoryFilter = 'all' | ActivityCategory;

export function ActivityLog() {
  const { data, deleteActivity } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortBy, setSortBy] = useState<ActivitySortOption>('newest');

  const sorted = useMemo(() => {
    let list = [...data.activities];

    if (categoryFilter !== 'all') {
      list = list.filter((a) => activityMatchesCategory(a.type, categoryFilter));
    }
    if (dateFrom) {
      list = list.filter((a) => a.date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((a) => a.date <= dateTo);
    }
    if (partnerFilter) {
      list = list.filter((a) => activityInvolvesPartner(a, partnerFilter));
    }

    return sortActivities(list, sortBy, data.partners);
  }, [data.activities, data.partners, categoryFilter, dateFrom, dateTo, partnerFilter, sortBy]);

  const handleDelete = (a: Activity) => {
    if (confirm('Delete this activity log entry?')) {
      deleteActivity(a.id);
    }
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setPartnerFilter('');
  };

  const hasFilters =
    categoryFilter !== 'all' || dateFrom || dateTo || partnerFilter;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Activity Log</h1>
          <p className="page-header__sub">Private record of intimacy and connection</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
          + Add
        </button>
      </header>

      <div className="filter-panel">
        <label>
          Type
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          >
            <option value="all">All types</option>
            {(
              Object.entries(ACTIVITY_CATEGORIES) as [
                ActivityCategory,
                (typeof ACTIVITY_CATEGORIES)[ActivityCategory],
              ][]
            ).map(([key, group]) => (
              <option key={key} value={key}>
                {group.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>

        {data.partners.length > 0 && (
          <label>
            Partner
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
            >
              <option value="">All partners</option>
              {data.partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname || p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {hasFilters && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        <label>
          Sort
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ActivitySortOption)}
          >
            {(Object.entries(ACTIVITY_SORT_LABELS) as [ActivitySortOption, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon="◎"
          title={hasFilters ? 'No matching activities' : 'Your log is empty'}
          description={
            hasFilters
              ? 'Try adjusting your filters or log a new activity.'
              : 'Add activities to track partner time, solo sessions, and more.'
          }
          action={
            !hasFilters ? (
              <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
                Log first activity
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card-list">
          {sorted.map((a) => {
            const partnerLabel = getPartnerLinkLabel(a, data.partners);
            return (
              <Card key={a.id} className="activity-card">
                <div className="activity-log-line activity-log-line--card">
                  <span className="badge">{ACTIVITY_TYPE_LABELS[a.type]}</span>
                  {(a.partnerIds.length > 0 || partnerLabel) && (
                    <>
                      <span className="activity-log-line__sep">•</span>
                      {a.partnerIds.length > 0 ? (
                        <PartnerChipList
                          partnerIds={a.partnerIds}
                          partners={data.partners}
                        />
                      ) : (
                        <span className="partner-chip partner-chip--muted">
                          {partnerLabel}
                        </span>
                      )}
                    </>
                  )}
                  <span className="activity-log-line__sep">•</span>
                  <span className="text-muted">{formatDateNumeric(a.date)}</span>
                </div>
                <div className="activity-card__body">
                  <p>{formatActivitySchedule(a)}</p>
                  <p>Satisfaction {a.satisfaction}/10</p>
                  {isPartnerActivity(a.type) && a.protection !== 'na' && (
                    <p className="text-muted">
                      Protection: {a.protection === 'yes' ? 'Yes' : 'No'}
                    </p>
                  )}
                  {a.notes && <p className="activity-card__notes">{a.notes}</p>}
                </div>
                <div className="activity-card__actions">
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setEditing(a)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--sm btn--danger"
                    onClick={() => handleDelete(a)}
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log activity">
        <ActivityForm onDone={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit activity">
        {editing && (
          <ActivityForm initial={editing} onDone={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
