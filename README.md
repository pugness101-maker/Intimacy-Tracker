# Intimacy Tracker

A private, mobile-first web app for tracking intimacy, solo activity, partners, sexual health, goals, and analytics. All data stays in your browser under `localStorage` key `intimacy-tracker-v1`.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Features

- **Dashboard** — monthly stats, streaks, recent activity
- **Activity Log** — partner, solo, makeout, cuddling, date night, other
- **Partners** — profiles with auto-calculated last intimacy
- **Goals** — frequency, no-porn challenge, solo limits, safe-sex, connection
- **Sexual Health** — STI tests, birth control, cycle notes, appointments, condom stats
- **Analytics** — breakdowns, partner history, calendar heatmap
- **Settings** — PIN placeholder, JSON export/import, clear data

## Data model

Structured for future Supabase sync: all records use `id`, `createdAt`, and `updatedAt` fields.
