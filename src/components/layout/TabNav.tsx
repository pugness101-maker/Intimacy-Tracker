import type { TabId } from '../../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '◉' },
  { id: 'activity', label: 'Log', icon: '◎' },
  { id: 'partners', label: 'People', icon: '♡' },
  { id: 'goals', label: 'Goals', icon: '◇' },
  { id: 'health', label: 'Health', icon: '✚' },
  { id: 'analytics', label: 'Stats', icon: '▦' },
  { id: 'settings', label: 'More', icon: '⚙' },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-nav__item ${active === tab.id ? 'tab-nav__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="tab-nav__icon" aria-hidden>
            {tab.icon}
          </span>
          <span className="tab-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
