import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { ACTIVITY_CATEGORIES, type Goals } from '../types';
import { getMonthlyActivities } from '../lib/analytics';
import { isSameWeek } from '../lib/utils';
import { getCondomUsageStats } from '../lib/analytics';

export function GoalsPage() {
  const { data, setGoals } = useApp();
  const goals = data.goals;

  const update = (patch: Partial<Goals>) => {
    setGoals({ ...goals, ...patch });
  };

  const monthActivities = getMonthlyActivities(data.activities);
  const weekSolo = data.activities.filter(
    (a) => a.type === 'masturbation' && isSameWeek(a.date)
  ).length;
  const condom = getCondomUsageStats(data.activities);
  const connectionTypes = ACTIVITY_CATEGORIES.relationship.types;
  const connectionCount = monthActivities.filter((a) =>
    connectionTypes.includes(a.type)
  ).length;

  const freqCount = monthActivities.filter((a) =>
    goals.frequency.activityTypes.includes(a.type)
  ).length;
  const freqTarget =
    goals.frequency.period === 'week'
      ? Math.ceil(goals.frequency.count * 4.3)
      : goals.frequency.count;

  const noPornDays = goals.noPorn.enabled
    ? Math.floor(
        (Date.now() - new Date(goals.noPorn.startDate + 'T12:00:00').getTime()) /
          86400000
      )
    : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Goals</h1>
          <p className="page-header__sub">Personal wellness targets</p>
        </div>
      </header>

      <div className="card-list">
        <GoalCard
          title="Frequency goal"
          description="Target number of selected activities per period."
          enabled={goals.frequency.enabled}
          onToggle={(enabled) =>
            update({ frequency: { ...goals.frequency, enabled } })
          }
        >
          <div className="form-row form-row--2">
            <label>
              Target count
              <input
                type="number"
                min={1}
                max={99}
                value={goals.frequency.count}
                onChange={(e) =>
                  update({
                    frequency: {
                      ...goals.frequency,
                      count: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Period
              <select
                value={goals.frequency.period}
                onChange={(e) =>
                  update({
                    frequency: {
                      ...goals.frequency,
                      period: e.target.value as 'week' | 'month',
                    },
                  })
                }
              >
                <option value="week">Per week</option>
                <option value="month">Per month</option>
              </select>
            </label>
          </div>
          <p className="goal-progress">
            This month: {freqCount} / ~{freqTarget} target
          </p>
        </GoalCard>

        <GoalCard
          title="No-porn challenge"
          description="Track days since your challenge start date."
          enabled={goals.noPorn.enabled}
          onToggle={(enabled) =>
            update({ noPorn: { ...goals.noPorn, enabled } })
          }
        >
          <label>
            Start date
            <input
              type="date"
              value={goals.noPorn.startDate}
              onChange={(e) =>
                update({
                  noPorn: { ...goals.noPorn, startDate: e.target.value },
                })
              }
            />
          </label>
          <p className="goal-progress">{noPornDays} days on challenge</p>
        </GoalCard>

        <GoalCard
          title="Solo limit per week"
          description="Keep masturbation within a healthy weekly cap."
          enabled={goals.soloLimit.enabled}
          onToggle={(enabled) =>
            update({ soloLimit: { ...goals.soloLimit, enabled } })
          }
        >
          <label>
            Max per week
            <input
              type="number"
              min={0}
              max={21}
              value={goals.soloLimit.maxPerWeek}
              onChange={(e) =>
                update({
                  soloLimit: {
                    ...goals.soloLimit,
                    maxPerWeek: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <p
            className={`goal-progress ${weekSolo > goals.soloLimit.maxPerWeek ? 'goal-progress--warn' : ''}`}
          >
            This week: {weekSolo} / {goals.soloLimit.maxPerWeek}
          </p>
        </GoalCard>

        <GoalCard
          title="Safe-sex goal"
          description="Target percent of partner activities with protection when applicable."
          enabled={goals.safeSex.enabled}
          onToggle={(enabled) =>
            update({ safeSex: { ...goals.safeSex, enabled } })
          }
        >
          <label>
            Target protection rate (%)
            <input
              type="number"
              min={0}
              max={100}
              value={goals.safeSex.targetPercent}
              onChange={(e) =>
                update({
                  safeSex: {
                    ...goals.safeSex,
                    targetPercent: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <p className="goal-progress">
            Current: {condom.percentProtected ?? '—'}% ({condom.yes} yes /{' '}
            {condom.applicable} applicable)
          </p>
        </GoalCard>

        <GoalCard
          title="Relationship connection"
          description="Monthly target for relationship activities (makeout, cuddling, date night)."
          enabled={goals.connection.enabled}
          onToggle={(enabled) =>
            update({ connection: { ...goals.connection, enabled } })
          }
        >
          <label>
            Description
            <input
              value={goals.connection.description}
              onChange={(e) =>
                update({
                  connection: {
                    ...goals.connection,
                    description: e.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            Target per month
            <input
              type="number"
              min={1}
              max={60}
              value={goals.connection.targetPerMonth}
              onChange={(e) =>
                update({
                  connection: {
                    ...goals.connection,
                    targetPerMonth: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <p className="goal-progress">
            This month: {connectionCount} / {goals.connection.targetPerMonth}
          </p>
        </GoalCard>
      </div>
    </div>
  );
}

function GoalCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="goal-card">
      <div className="goal-card__header">
        <div>
          <h3>{title}</h3>
          <p className="text-muted">{description}</p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          <span className="toggle__slider" />
        </label>
      </div>
      {enabled && <div className="goal-card__body">{children}</div>}
    </Card>
  );
}
