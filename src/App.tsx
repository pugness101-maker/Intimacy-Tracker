import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { TabNav } from './components/layout/TabNav';
import { Dashboard } from './pages/Dashboard';
import { ActivityLog } from './pages/ActivityLog';
import { Partners } from './pages/Partners';
import { GoalsPage } from './pages/Goals';
import { SexualHealth } from './pages/SexualHealth';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import type { TabId } from './types';
import './App.css';

function AppShell() {
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div className="app">
      <aside className="app__sidebar">
        <div className="brand">
          <span className="brand__icon" aria-hidden>
            ◎
          </span>
          <div>
            <h1 className="brand__title">Intimacy Tracker</h1>
            <p className="brand__tagline">Private · Local · Yours</p>
          </div>
        </div>
        <TabNav active={tab} onChange={setTab} />
      </aside>

      <main className="app__main">
        {tab === 'dashboard' && (
          <Dashboard onGoToLog={() => setTab('activity')} />
        )}
        {tab === 'activity' && <ActivityLog />}
        {tab === 'partners' && <Partners />}
        {tab === 'goals' && <GoalsPage />}
        {tab === 'health' && <SexualHealth />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'settings' && <Settings />}
      </main>

      <div className="app__mobile-nav">
        <TabNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
