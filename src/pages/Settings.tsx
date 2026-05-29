import { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { downloadJson } from '../lib/utils';
import { STORAGE_KEY, type AppData } from '../types';
import { Card } from '../components/ui/Card';

export function Settings() {
  const { data, setSettings, importData, resetAll } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadJson(
      `intimacy-tracker-export-${new Date().toISOString().slice(0, 10)}.json`,
      data
    );
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        if (!parsed.activities || !parsed.partners) {
          alert('Invalid backup file format.');
          return;
        }
        if (
          confirm(
            'Import will replace all current data on this device. Continue?'
          )
        ) {
          importData(parsed);
          alert('Import complete.');
        }
      } catch {
        alert('Could not read file. Ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (
      confirm(
        'This will permanently delete all data stored under intimacy-tracker-v1 on this device. This cannot be undone.'
      )
    ) {
      resetAll();
      alert('All data cleared.');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="page-header__sub">Privacy, backup, and app preferences</p>
      </header>

      <div className="card-list">
        <Card className="settings-card">
          <h3>PIN lock</h3>
          <p className="text-muted">
            Placeholder for future app lock. Enable to require a PIN when opening
            the app (not yet implemented).
          </p>
          <label className="toggle-row">
            <span>Enable PIN lock</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={data.settings.pinEnabled}
                onChange={(e) =>
                  setSettings({ ...data.settings, pinEnabled: e.target.checked })
                }
              />
              <span className="toggle__slider" />
            </label>
          </label>
          {data.settings.pinEnabled && (
            <p className="settings-note">PIN setup will be available in a future update.</p>
          )}
        </Card>

        <Card className="settings-card">
          <h3>Export data</h3>
          <p className="text-muted">
            Download a JSON backup of all activities, partners, goals, and health
            records.
          </p>
          <button type="button" className="btn btn--primary" onClick={handleExport}>
            Export JSON
          </button>
        </Card>

        <Card className="settings-card">
          <h3>Import data</h3>
          <p className="text-muted">
            Restore from a previously exported JSON file. Replaces current local data.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
        </Card>

        <Card className="settings-card settings-card--danger">
          <h3>Clear all data</h3>
          <p className="text-muted">
            Remove everything stored under <code>{STORAGE_KEY}</code> in
            localStorage.
          </p>
          <button type="button" className="btn btn--danger" onClick={handleClear}>
            Clear all data
          </button>
        </Card>

        <Card className="settings-card settings-card--muted">
          <h3>About</h3>
          <p className="text-muted">
            Intimacy Tracker v1 · Data stays on this device until you export or
            sync (Supabase-ready schema). Last saved:{' '}
            {new Date(data.updatedAt).toLocaleString()}
          </p>
        </Card>
      </div>
    </div>
  );
}
