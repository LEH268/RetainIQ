# RetainIQ — Frontend

A basic React scaffold for the RetainIQ customer retention platform, matching the PRD tech stack (React + Tailwind CSS, Recharts, Firebase Auth, FastAPI backend via Axios).

## What's included
- **Vite + React** project setup
- **Tailwind CSS v4** (via `@tailwindcss/vite`) with a custom theme (health/risk colors, display + body fonts)
- **React Router** for page navigation (`/login`, `/`, `/customers`, `/customers/:id`)
- **Recharts** dashboard: health distribution pie chart, churn trend line chart, segmentation bar chart
- **Firebase Authentication** wiring (`src/lib/firebase.js`) — plug in your project config
- **Axios API client** (`src/lib/api.js`) — points at your FastAPI backend, attaches auth token automatically
- Placeholder/mock data in `src/data/mockCustomers.js` so the dashboard renders immediately

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your Firebase + API values
cp .env.example .env

# 3. Run the dev server
npm run dev
```

The app will be available at http://localhost:5173

## Project structure

```
src/
  components/       # Sidebar, StatCard, RiskBadge — shared UI
  pages/            # Login, Dashboard, Customers, CustomerProfile
  lib/
    firebase.js      # Firebase Authentication setup
    api.js           # Axios client for the FastAPI backend
  data/
    mockCustomers.js # Placeholder data — replace with real API calls
  App.jsx            # Routes + layout
  main.jsx           # Entry point
  index.css          # Tailwind import + theme tokens
```

## Next steps (per the PRD)
1. Replace `useIsAuthed()` in `App.jsx` with real Firebase auth state (`onAuthStateChanged`).
2. Replace `mockCustomers.js` data with calls to your FastAPI endpoints via `src/lib/api.js`.
3. Build out the AI Churn Prediction, Explainable AI Insights, and Action Simulator features on the Customer Profile page.
4. Add the Notifications and Report Export (CSV/PDF) features.
