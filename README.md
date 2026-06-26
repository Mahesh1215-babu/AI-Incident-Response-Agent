# 🤖 AI Incident Response Agent

> A production-ready AI-powered platform for DevOps and Site Reliability Engineers to analyze production incidents, recall historical context, recommend proven solutions, and optimize AI model selection — powered by **Hindsight** (persistent memory) and **cascadeflow** (runtime intelligence).

---

## ✨ Core Features

| Feature | Technology | Description |
|---|---|---|
| 🧠 Persistent Memory | **Hindsight** | Recalls similar past incidents during analysis to provide historical context and proven resolutions |
| ⚡ Smart Model Routing | **cascadeflow** | Dynamically routes AI requests to the optimal model (speed vs cost vs quality) at runtime |
| 📁 Log File Analysis | Backend Parser | Upload `.log`, `.txt`, or `.json` files for automatic text extraction and analysis |
| 📊 Analytics Dashboard | Chart.js | Real-time KPIs: incident counts, resolution trends, model usage distribution, cost savings |
| 🔐 JWT Authentication | FastAPI + PyJWT | Secure login/signup with access-controlled admin panel |
| 🌙 Light / Dark Mode | React Context | Full theme toggle with smooth transitions |
| 📤 Export & Reporting | Frontend | Export incident history to CSV and detailed cascadeflow billing audit ledger |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                    Frontend                       │
│  Vite + React 18 + Tailwind CSS + Chart.js       │
│  React Router v6 · Framer Motion · Lucide Icons  │
└───────────────────┬──────────────────────────────┘
                    │ REST API (http://127.0.0.1:8000)
┌───────────────────▼──────────────────────────────┐
│                    Backend                        │
│             FastAPI (Python 3.10+)               │
│                                                  │
│  ┌─────────────────┐   ┌──────────────────────┐  │
│  │  Hindsight      │   │  cascadeflow         │  │
│  │  Memory Engine  │   │  Router              │  │
│  │                 │   │                      │  │
│  │  - Text search  │   │  - Severity routing  │  │
│  │  - Similarity   │   │  - Cost optimization │  │
│  │  - Auto-store   │   │  - Audit logging     │  │
│  └────────┬────────┘   └──────────┬───────────┘  │
│           │                       │              │
│  ┌────────▼───────────────────────▼───────────┐  │
│  │          MongoDB (Motor async driver)       │  │
│  │   Collections: incidents · memories ·      │  │
│  │               users · audit_logs           │  │
│  └─────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### How Hindsight Works

When an engineer submits a log for analysis, the Hindsight engine:
1. Performs text-similarity search against all previously resolved incidents in the `memories` collection
2. Formats up to 3 matching memories as context (root cause, resolution, success rate, engineer notes)
3. Injects this context into the AI analysis prompt to guide the recommendation
4. After the engineer marks an incident as **Resolved** and submits feedback, the full resolution is automatically persisted into Hindsight memory for future recall

### How cascadeflow Works

Before calling any AI model, cascadeflow evaluates the request:
1. **Severity Routing**: Critical/High incidents → premium models (GPT-4o); Low/Medium → efficient models (Groq Llama)
2. **Cost Tracking**: Records token count, latency, and cost per request in `audit_logs`
3. **Dashboard Visibility**: All routing decisions are visible in the Reports page audit ledger

---

## 📦 Tech Stack

**Backend**
- Python 3.10+, FastAPI, Uvicorn
- Motor (async MongoDB driver)
- PyJWT, Passlib (bcrypt)
- Groq / OpenAI API clients

**Frontend**
- React 18, Vite 8
- Tailwind CSS, Framer Motion
- Chart.js + react-chartjs-2
- React Router v6, Axios, Lucide React

**Database**
- MongoDB Atlas (cloud) or local JSON fallback (offline mode — no setup required)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **Python** ≥ 3.10
- A **MongoDB Atlas** URI (optional — app works in offline mode without it)
- A **Groq API Key** or **OpenAI API Key** (optional — app uses simulation mode without it)

---

### 1. Clone & Configure Environment

```bash
# Copy the environment template
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# MongoDB Atlas URI (leave blank for offline JSON-based mode)
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/incident_agent?retryWrites=true&w=majority

# JWT Secret (change this in production!)
JWT_SECRET=your-strong-random-secret-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Keys (leave both blank to activate simulation mode)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server
HOST=127.0.0.1
PORT=8000
```

---

### 2. Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at: **http://127.0.0.1:8000**
Interactive API docs: **http://127.0.0.1:8000/docs**

---

### 3. Start the Frontend

Open a second terminal:

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

The application will open at: **http://localhost:5173**

---

### 4. First Login

On first launch, register a new account via the **Sign Up** page. The first registered user is automatically granted **admin** privileges.

Default demo flow:
1. Sign up → Log in
2. Go to **Analyze Incident** → paste a log or upload a file
3. Submit analysis → review Hindsight matches and cascadeflow routing decision
4. Mark as resolved → add engineer notes → submit feedback (this saves to Hindsight memory)
5. Analyze a similar log — watch Hindsight recall the previous resolution

---

## 📄 Sample Log Files

Paste any of these into the **Analyze Incident** log text box to test the agent:

---

### Sample 1 — Database Connection Failure (Critical)

```
[2024-01-15 02:47:33] ERROR  DatabasePool: Connection timeout after 30000ms
[2024-01-15 02:47:33] ERROR  Host: db-primary.prod.internal:5432
[2024-01-15 02:47:34] FATAL  ConnectionPool exhausted: 0/100 connections available
[2024-01-15 02:47:34] ERROR  PostgreSQL: FATAL: max_connections exceeded (current: 100, limit: 100)
[2024-01-15 02:47:35] WARN   Retrying connection... attempt 1/3
[2024-01-15 02:47:38] WARN   Retrying connection... attempt 2/3
[2024-01-15 02:47:41] ERROR  All retry attempts failed. Service degraded.
[2024-01-15 02:47:41] ERROR  API: /api/users endpoint returning 503 Service Unavailable
[2024-01-15 02:47:41] CRITICAL Alerting: PagerDuty incident #P1-4821 triggered
```

**Expected Analysis**: PostgreSQL connection pool exhaustion, root cause max_connections limit

---

### Sample 2 — Kubernetes OOMKilled Pod (High)

```
[2024-02-03 14:22:11] INFO   Pod: payment-service-7d9b8c-xk2p9 starting
[2024-02-03 14:22:45] WARN   Memory usage at 87% (1.74GB / 2GB limit)
[2024-02-03 14:22:58] WARN   Memory usage at 94% (1.88GB / 2GB limit)
[2024-02-03 14:23:02] ERROR  OOMKilled: Container payment-processor exceeded memory limit
[2024-02-03 14:23:02] ERROR  Exit code: 137 (SIGKILL)
[2024-02-03 14:23:03] INFO   Kubernetes: Restarting pod... (restart count: 4)
[2024-02-03 14:23:03] WARN   CrashLoopBackOff detected — 4 restarts in 10 minutes
[2024-02-03 14:23:10] ERROR  Service: payment-service unavailable — orders queue backing up
[2024-02-03 14:23:10] ERROR  Downstream: checkout-service receiving connection refused on port 8080
```

**Expected Analysis**: Memory leak or resource limit misconfiguration causing OOM restarts

---

### Sample 3 — API Gateway 5xx Spike (Medium)

```
[2024-03-20 09:15:00] INFO   Traffic spike detected: 12,400 req/s (baseline: 2,100 req/s)
[2024-03-20 09:15:02] WARN   upstream: auth-service response time 820ms (threshold: 500ms)
[2024-03-20 09:15:04] ERROR  nginx: upstream timed out (110: Connection timed out) while reading response header
[2024-03-20 09:15:04] ERROR  GET /api/v2/users 504 Gateway Timeout (1032ms)
[2024-03-20 09:15:05] ERROR  GET /api/v2/orders 502 Bad Gateway
[2024-03-20 09:15:06] WARN   Redis cache hit rate: 12% (normal: 94%) — cache cold after restart
[2024-03-20 09:15:07] ERROR  Rate of 5xx errors: 34% (threshold: 2%)
[2024-03-20 09:15:08] WARN   Circuit breaker: auth-service OPEN (failures: 47/50 threshold)
```

**Expected Analysis**: Cache invalidation causing auth service overload during traffic spike

---

### Sample 4 — SSL Certificate Expiry (Low)

```
[2024-04-10 00:00:01] WARN   SSL certificate for api.example.com expires in 7 days
[2024-04-10 00:00:01] WARN   Certificate: *.example.com — issued by Let's Encrypt
[2024-04-10 00:00:01] WARN   Auto-renewal failed: ACME challenge domain validation error
[2024-04-10 00:00:01] ERROR  DNS TXT record _acme-challenge.api.example.com not found
[2024-04-10 00:00:02] INFO   Certbot: retrying renewal in 24 hours
[2024-04-10 00:00:02] WARN   Action required: manual renewal may be needed within 6 days
```

**Expected Analysis**: ACME DNS challenge failing for Let's Encrypt auto-renewal

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, get JWT token |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `POST` | `/api/incidents/upload-log` | ✅ | Upload log file (.log/.txt/.json) |
| `POST` | `/api/incidents/analyze` | ✅ | Analyze incident with Hindsight + cascadeflow |
| `GET` | `/api/incidents/incidents` | ✅ | List incidents (search, filter, sort) |
| `GET` | `/api/incidents/incident/{id}` | ✅ | Get single incident |
| `DELETE` | `/api/incidents/incident/{id}` | 🔒 Admin | Delete incident |
| `POST` | `/api/incidents/feedback` | ✅ | Submit resolution → triggers Hindsight save |
| `GET` | `/api/memory/search` | ✅ | Search Hindsight memory store |
| `GET` | `/api/memory/all` | ✅ | Get all memory entries |
| `GET` | `/api/reports/summary` | ✅ | Aggregated analytics (KPIs, charts) |
| `GET` | `/api/reports/health` | ✅ | System health status |
| `GET` | `/api/admin/users` | 🔒 Admin | List all users |
| `DELETE` | `/api/admin/users/{id}` | 🔒 Admin | Delete user |

Full interactive docs available at: `http://127.0.0.1:8000/docs`

---

## 🗂️ Project Structure

```
agent/
├── .env                        # Environment variables (not committed)
├── .env.example                # Environment template
├── README.md
│
├── backend/
│   ├── main.py                 # FastAPI application entry point, CORS config
│   ├── requirements.txt        # Python dependencies
│   │
│   ├── cascade/
│   │   └── cascadeflow.py      # AI model routing logic & audit logging
│   │
│   ├── memory/
│   │   └── hindsight.py        # Persistent memory engine (search + store)
│   │
│   ├── database/
│   │   └── db.py               # MongoDB motor client + JSON fallback
│   │
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response schemas
│   │
│   ├── routers/
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── incidents.py        # Incident analysis pipeline
│   │   ├── memory.py           # Memory Explorer endpoints
│   │   └── reports.py          # Analytics and health endpoints
│   │
│   └── utils/
│       └── helpers.py          # JWT auth helpers, utilities
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx             # Router configuration
        ├── main.jsx            # React entry point
        ├── index.css           # Global styles + Tailwind layers
        │
        ├── context/
        │   └── AuthContext.jsx # Auth state + dark mode context
        │
        ├── services/
        │   └── api.js          # Axios instance + API service wrappers
        │
        ├── components/
        │   ├── Sidebar.jsx     # Navigation sidebar
        │   ├── Navbar.jsx      # Top header bar
        │   └── ProtectedRoute.jsx
        │
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── ForgotPassword.jsx
            ├── Dashboard.jsx       # KPI cards + charts
            ├── AnalyzeIncident.jsx # Log upload + AI analysis
            ├── IncidentHistory.jsx # Filterable incident ledger
            ├── MemoryExplorer.jsx  # Hindsight memory browser
            ├── Reports.jsx         # cascadeflow audit + analytics
            └── AdminPanel.jsx      # User management + system health
```

---

## 🛠️ Offline / Simulation Mode

The app works **completely without any external services**:

| Service | Offline Behaviour |
|---|---|
| MongoDB Atlas | Falls back to `backend/database/local_db.json` — a JSON file that mimics collection operations |
| Groq / OpenAI | Falls back to deterministic simulation mode — generates realistic-looking AI analysis without API calls |

This means you can run a full demo with zero API keys or database setup.

---

## 🔧 Production Build

```bash
cd frontend
npm run build       # Outputs to frontend/dist/
```

To serve the production frontend with the backend:

```bash
# Option 1: Serve dist/ with a static file server
npx serve frontend/dist -p 3000

# Option 2: Configure FastAPI to serve the dist/ directory as static files
# (add StaticFiles mount to backend/main.py)
```

---

## 🔑 Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | Optional | (JSON fallback) | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT token signing |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | Token TTL (24 hours) |
| `GROQ_API_KEY` | Optional | (simulation) | Groq API key for Llama models |
| `OPENAI_API_KEY` | Optional | (simulation) | OpenAI API key for GPT-4o |
| `HOST` | No | `127.0.0.1` | Backend bind host |
| `PORT` | No | `8000` | Backend bind port |

---

## 🐛 Troubleshooting

**Backend won't start — `ModuleNotFoundError`**
```bash
# Make sure your venv is active and you're in the backend directory
cd backend && pip install -r requirements.txt
```

**Frontend: `npm run build` fails on Windows (execution policy)**
```powershell
# Run with explicit bypass
powershell -ExecutionPolicy Bypass -Command "npm run build"
```

**Frontend shows "Telemetry Offline" on Dashboard**
- Ensure the backend is running on `http://127.0.0.1:8000`
- Check `frontend/src/services/api.js` — the `baseURL` must match your backend address

**MongoDB connection errors**
- Leave `MONGO_URI=` empty in `.env` to fall back to local JSON mode automatically

---

## 📝 License

MIT License — feel free to use, fork, and adapt for your organization's incident response workflows.
