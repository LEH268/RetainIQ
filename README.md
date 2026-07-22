# RetainIQ

Customer retention analytics for a music-streaming subscription business. RetainIQ scores churn risk per subscriber with a trained logistic-regression model, segments the base by risk and plan, and uses an LLM to explain *why* a given customer is at risk and draft the outreach to keep them.

**Live demo:** https://retainiq-frontend-u2vh.onrender.com

---

## Overview

The dataset is 1,639 music-streaming subscribers with listening behaviour, podcast preferences, plan tier, and signup/cancel dates. RetainIQ turns that into a retention workflow:

- **Score** — a scikit-learn pipeline (one-hot + standard-scaled logistic regression) predicts churn probability, reporting ROC-AUC on a held-out split.
- **Segment** — customers group by risk band and plan tier, each with a recommended action from a built-in action library.
- **Explain** — an LLM narrates the drivers behind an individual customer's risk score, citing their actual feature values.
- **Act** — generate retention emails, simulate intervention options, and track campaigns against recipient lists.

The model artefact is cached to `models/churn_model.joblib`. If the dataset or model is unavailable, the service falls back to a documented heuristic rather than hard-failing.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, Recharts, Axios, Lucide |
| Backend | FastAPI 0.115, Uvicorn |
| ML | scikit-learn 1.6, pandas 2.2, NumPy 2.2, joblib |
| AI | Groq (`llama-3.3-70b-versatile`) via the OpenAI-compatible SDK |
| Auth | Firebase Authentication (email/password) |
| Deployment | Render — static frontend + Python web service (`render.yaml`) |

## Project Structure

```
RetainIQ/
├── retainiq-backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── api/                    # Route handlers per domain
│   │   ├── dashboard.py        # KPI tiles
│   │   ├── customers.py        # List, detail, filter facets
│   │   ├── analytics.py        # KPIs, distributions, date ranges
│   │   ├── segmentation.py     # Segments, action library, bulk actions
│   │   ├── recommendations.py  # Per-customer recommended actions
│   │   ├── campaigns.py        # Campaign CRUD + recipients
│   │   ├── reports.py          # Reporting endpoints
│   │   ├── ai.py               # Explain, chat, email gen, simulation
│   │   └── settings.py         # App settings
│   ├── services/
│   │   ├── churn_model.py      # sklearn pipeline: train, cache, metrics
│   │   ├── churn_prediction.py # Scoring interface
│   │   ├── health_score.py     # Customer health scoring
│   │   ├── timeseries.py       # Time-series aggregation
│   │   ├── date_filters.py     # Date-range helpers
│   │   └── ai_client.py        # Groq client, prompts, JSON extraction
│   ├── data_processing/        # Dataset loading + generation
│   ├── dataset/customer_data.csv
│   └── models/churn_model.joblib
├── retainiq-frontend/
│   └── src/
│       ├── pages/              # Dashboard, Customers, CustomerProfile,
│       │                       # Analytics, Segmentation, Recommendations,
│       │                       # Campaigns, Reports, Settings, Login, Register
│       ├── components/         # Sidebar, StatCard, RiskBadge, AIChat
│       ├── lib/                # api.js (Axios), firebase.js
│       └── utils/              # dataMapper.js, exportCsv.js
└── render.yaml
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Groq API key](https://console.groq.com) for the AI features
- A Firebase project with Email/Password auth enabled

### Backend

```bash
cd retainiq-backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `retainiq-backend/.env`:

```env
GROQ_API_KEY=your_groq_key_here
OPENAI_MODEL=llama-3.3-70b-versatile
AI_CACHE_TTL=1800
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Run it:

```bash
uvicorn main:app --reload
```

API at `http://localhost:8000` · interactive docs at `/docs` · health check at `/api/health` (reports dataset load, model metrics, and AI readiness).

### Frontend

```bash
cd retainiq-frontend
npm install
```

Create `retainiq-frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

```bash
npm run dev
```

App at `http://localhost:5173`.

## Environment Variables

**Backend**

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Yes (for AI) | Groq API key. Without it, AI endpoints return a configured-but-unavailable state; the rest of the app still works. |
| `OPENAI_MODEL` | No | Model ID. Defaults to `llama-3.3-70b-versatile`. |
| `AI_CACHE_TTL` | No | Seconds to cache AI responses. Defaults to 1800. |
| `CORS_ORIGINS` | No | Comma-separated allowed origins. |

**Frontend**

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL. The client appends `/api`. |
| `VITE_FIREBASE_*` | Yes | Firebase web app config (6 values). |

## Demo Accounts

The deployed demo has three seeded Firebase accounts:

| Label | Email | Password |
|---|---|---|
| Admin | `admin@retainiq.com` | `RetainIQ@123` |
| Manager | `manager@retainiq.com` | `Manager@123` |
| Analyst | `analyst@retainiq.com` | `Analyst@123` |

> **Note:** These are throwaway credentials for the public demo instance only. The app does not currently implement role-based access control — all three accounts see the same views and have identical permissions. The labels indicate intended personas, not enforced roles. If you deploy your own instance, create your own Firebase users and do not reuse these passwords.

## API Reference

Full interactive docs at `/docs`. Key endpoints:

**Dashboard & Analytics**
```
GET  /api/dashboard/stats
GET  /api/analytics            /kpis  /summary  /distributions  /range
```

**Customers**
```
GET  /api/customers            /facets  /{customer_id}
```

**Segmentation & Recommendations**
```
GET  /api/segments             /action-library  /{segment_name}/actions
POST /api/segments/bulk-action
GET  /api/recommendations
POST /api/recommendations/{customer_id}/action
```

**Campaigns**
```
GET    /api/campaigns          /{campaign_id}/recipients
POST   /api/campaigns
PUT    /api/campaigns/{campaign_id}
DELETE /api/campaigns/{campaign_id}
```

**AI**
```
GET  /api/ai/status
GET  /api/ai/explain/{customer_id}
GET  /api/ai/generate-insights
GET  /api/ai/simulate-options/{customer_id}
POST /api/ai/chat
POST /api/ai/generate-email
POST /api/ai/simulate
```

**Reports & Settings**
```
GET  /api/reports              /range
GET  /api/settings
POST /api/settings
```

## Deployment

`render.yaml` defines both services as a Render blueprint. Set `GROQ_API_KEY` and the six `VITE_FIREBASE_*` values as secrets in the Render dashboard. Add your deployed frontend URL to the backend's `CORS_ORIGINS`, and add the frontend domain to Firebase Authentication's authorised domains.

## Roadmap

- Role-based access control backing the Admin / Manager / Analyst personas
- Persistent storage for campaigns and settings (currently in-memory)
- Model retraining pipeline and drift monitoring
