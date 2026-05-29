import { useState } from 'react';
import { getDashboardSummary } from '../lib/analytics';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ActivityForm } from '../components/forms/ActivityForm';
import {
  PartnerChipList,
  getPartnerLinkLabel,
} from '../components/activity/PartnerChips';
import { ACTIVITY_TYPE_LABELS, type Activity } from '../types';
import {
  formatDate,
  formatDateNumeric,
  formatDuration,
} from '../lib/utils';

interface DashboardProps {
  onGoToLog: () => void;
}

export function Dashboard({ onGoToLog }: DashboardProps) {
  const { data } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const summary = getDashboardSummary(data);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-header__sub">Your private wellness overview</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
          + Log
        </button>
      </header>

      <div className="stat-grid stat-grid--4">
        <Card className="stat-card">
          <span className="stat-card__label">Activities today</span>
          <span className="stat-card__value">{summary.activitiesToday}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">People today</span>
          <span className="stat-card__value">{summary.peopleToday}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Unique partners (week)</span>
          <span className="stat-card__value">{summary.uniquePartnersThisWeek}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Unique partners (month)</span>
          <span className="stat-card__value">{summary.uniquePartnersThisMonth}</span>
        </Card>
      </div>

      <div className="stat-grid stat-grid--dashboard">
        <Card className="stat-card">
          <span className="stat-card__label">Total activities</span>
          <span className="stat-card__value">{summary.totalActivities}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Partner activities</span>
          <span className="stat-card__value">{summary.totalPartnerActivities}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Last activity</span>
          <span className="stat-card__value stat-card__value--sm">
            {summary.lastActivity
              ? formatDate(summary.lastActivity.date)
              : '—'}
          </span>
          {summary.lastActivity && (
            <span className="stat-card__hint">
              {ACTIVITY_TYPE_LABELS[summary.lastActivity.type]}
            </span>
          )}
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Current streak</span>
          <span className="stat-card__value">{summary.streak}</span>
          <span className="stat-card__hint">day{summary.streak !== 1 ? 's' : ''}</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__label">Avg satisfaction</span>
          <span className="stat-card__value">{summary.avgSatisfaction ?? '—'}</span>
          <span className="stat-card__hint">out of 10</span>
        </Card>
      </div>

      <section className="section">
        <h2>Recent activity</h2>
        {summary.recent.length === 0 ? (
          <EmptyState
            icon="◎"
            title="No activity yet"
            description="Log your first activity to start tracking privately on this device."
            action={
              <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
                Add activity
              </button>
            }
          />
        ) : (
          <div className="card-list">
            {summary.recent.map((a) => (
              <ActivityMini key={a.id} activity={a} />
            ))}
            <button type="button" className="link-btn" onClick={onGoToLog}>
              View all activity →
            </button>
          </div>
        )}
      </section>

      {summary.upcomingHealth.length > 0 && (
        <section className="section">
          <h2>Upcoming reminders</h2>
          <div className="card-list">
            {summary.upcomingHealth.map((h, i) => (
              <Card key={i} className="mini-card">
                <span className="badge">Health</span>
                <strong>{h.label}</strong>
                <span className="text-muted">{formatDate(h.date)}</span>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log activity">
        <ActivityForm onDone={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

function ActivityMini({ activity }: { activity: Activity }) {
  const { data } = useApp();
  const partnerLabel = getPartnerLinkLabel(activity, data.partners);

  return (
    <Card className="activity-mini">
      <div className="activity-log-line">
        <span className="badge">{ACTIVITY_TYPE_LABELS[activity.type]}</span>
        {(activity.partnerIds.length > 0 || partnerLabel) && (
          <>
            <span className="activity-log-line__sep">•</span>
            {activity.partnerIds.length > 0 ? (
              <PartnerChipList
                partnerIds={activity.partnerIds}
                partners={data.partners}
              />
            ) : (
              <span className="partner-chip partner-chip--muted">{partnerLabel}</span>
            )}
          </>
        )}
        <span className="activity-log-line__sep">•</span>
        <span className="text-muted">{formatDateNumeric(activity.date)}</span>
      </div>
      <div className="activity-mini__meta">
        <span>{formatDuration(activity.durationMinutes)}</span>
        <span>★ {activity.satisfaction}</span>
      </div>
    </Card>
  );
}
