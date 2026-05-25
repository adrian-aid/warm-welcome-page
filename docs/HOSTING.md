# Hosting Guide — AUS Banking Intelligence

**Version:** 1.1 | **Audience:** Developers, DevOps | **Last updated:** 2026-05

---

## Overview

This application has two services that must both be running:

| Service | Tech | Local port | Recommended free host |
|---|---|---|---|
| Frontend (React/Vite) | Node.js build → static files | 8080 | **Vercel** (free forever) |
| Backend (FastAPI) | Python process | 8000 | **Railway** or **Fly.io** (free tier) |

The frontend is a static site after build — zero server needed in production.  
The backend must stay alive as a persistent Python process (LangChain needs warm DataFrames).

---

## Option A: Vercel (Frontend) + Railway (Backend) — Recommended

This is the easiest setup with the best free tier for this stack.

### Why Railway over Render?

| | Railway | Render (free) |
|---|---|---|
| Free credits | $5/month | Discontinued for web services |
| Sleep on idle | No | Yes — 15min timeout, 30s cold start |
| RAM | 512MB | 512MB |
| Build time | Fast (Docker) | Moderate |
| Custom domains | Yes (free) | Yes (free) |

Railway's $5/month free credit is typically enough for a small FastAPI app running continuously.

---

### Step 1: Deploy the backend to Railway

**1a. Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

**1b. Create a new project:**
```bash
railway init
# Select "Deploy from Dockerfile"
# Project name: aus-banking-backend
```

**1c. Set environment variables in Railway dashboard:**
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
DEMO_MODE=false
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:8080
PORT=8000
```

**1d. Deploy:**
```bash
railway up
```

Railway will build the Dockerfile and deploy. Note the generated URL (e.g., `https://aus-banking-backend.up.railway.app`).

---

### Step 2: Deploy the frontend to Vercel

**2a. Install Vercel CLI:**
```bash
npm install -g vercel
vercel login
```

**2b. Set the backend URL:**

Edit `vercel.json` and update the env var:
```json
{
  "env": {
    "VITE_API_BASE_URL": "https://aus-banking-backend.up.railway.app"
  }
}
```

**2c. Deploy:**
```bash
vercel --prod
```

Or connect via the Vercel dashboard: Import → GitHub repo → Add env var `VITE_API_BASE_URL`.

**2d. Update CORS on backend:**

Once Vercel gives you a URL (e.g., `https://aus-banking.vercel.app`), update Railway's `CORS_ORIGINS`:
```
CORS_ORIGINS=https://aus-banking.vercel.app,http://localhost:8080
```

---

## Option B: Vercel (Frontend) + Fly.io (Backend) — True Free Tier

Fly.io has a permanent free tier (no credit card required for small apps).

### Fly.io free tier limits
- 3 shared CPU VMs, 256MB RAM each (use 1 for this app)
- 3GB persistent storage
- No sleep — stays awake
- 160GB outbound transfer/month

### Deploy to Fly.io

**1. Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
fly auth signup   # or fly auth login
```

**2. Launch from the repo root:**
```bash
fly launch
# App name: aus-banking-backend
# Region: syd (Sydney — closest to Australia)
# Dockerfile: yes (auto-detected)
# Database: no
# Deploy now: no (set secrets first)
```

**3. Set secrets:**
```bash
fly secrets set GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
fly secrets set DEMO_MODE=false
fly secrets set CORS_ORIGINS=https://your-app.vercel.app,http://localhost:8080
```

**4. Deploy:**
```bash
fly deploy
```

A `fly.toml` is auto-generated. Commit it. Your backend will be at `https://aus-banking-backend.fly.dev`.

### Persist the data cache on Fly.io

```bash
fly volumes create data_cache --size 1 --region syd
```

Then add to `fly.toml`:
```toml
[mounts]
  source = "data_cache"
  destination = "/app/backend/data/cache"
```

This persists cached CSV files between deploys.

---

## Option C: Google Cloud Run (Backend) — Generous Free Tier

Cloud Run is serverless but keeps containers warm for a few minutes, making cold starts infrequent.

**Free tier:** 2M requests/month, 360K GB-seconds compute, 2M egress/month.

```bash
# Build and push container
gcloud builds submit --tag gcr.io/YOUR_PROJECT/aus-banking-backend

# Deploy
gcloud run deploy aus-banking-backend \
  --image gcr.io/YOUR_PROJECT/aus-banking-backend \
  --platform managed \
  --region australia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=gsk_xxx,DEMO_MODE=false \
  --set-env-vars CORS_ORIGINS=https://your-app.vercel.app \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

---

## Local Docker (development / offline demo)

Runs both services in Docker Compose — useful for offline interview demos.

```bash
# Build and start
GROQ_API_KEY=gsk_xxx docker compose up

# Or with demo mode (no API key needed)
DEMO_MODE=true docker compose up
```

Services:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes (if DEMO_MODE=false) | — | Groq API key from console.groq.com |
| `DEMO_MODE` | No | `false` | Skip LLM calls; use static responses |
| `CORS_ORIGINS` | No | `http://localhost:8080,http://127.0.0.1:8080` | Comma-separated allowed origins |
| `PORT` | No | `8000` | Server port |

### Frontend (build-time)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No (dev only) | `http://localhost:8000` | Backend URL for production builds |
| `VITE_DEMO_MODE` | No | `false` | Passed to `__DEMO_MODE__` at build time |

---

## Keeping the Backend Awake (Render/free tiers with sleep)

If using a free tier that sleeps on idle, add a free uptime monitor:

**Option 1: UptimeRobot (free)**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add HTTP monitor → `https://your-backend.onrender.com/health`
3. Set interval: 5 minutes
4. This keeps the container warm

**Option 2: GitHub Actions cron (free)**
```yaml
# .github/workflows/keepalive.yml
name: Keep backend alive
on:
  schedule:
    - cron: "*/14 * * * *"  # Every 14 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -sf ${{ secrets.BACKEND_URL }}/health || true
```

---

## Custom Domain

### Vercel custom domain
1. Vercel dashboard → Settings → Domains → Add domain
2. Add CNAME record pointing to `cname.vercel-dns.com`
3. SSL is automatic (Let's Encrypt)

### Fly.io custom domain
```bash
fly certs add your-domain.com
fly certs show your-domain.com  # shows DNS records to set
```

---

## CI/CD with GitHub Actions (automated deploys)

After the CI pipeline passes, auto-deploy with:

```yaml
# Add to .github/workflows/ci.yml (deploy step)
deploy-backend:
  needs: [backend]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: superfly/flyctl-actions/setup-flyctl@master
    - run: flyctl deploy --remote-only
      env:
        FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

deploy-frontend:
  needs: [frontend]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: "--prod"
```

---

## Troubleshooting Deployed App

| Problem | Likely cause | Fix |
|---|---|---|
| Charts don't load | CORS misconfigured | Check `CORS_ORIGINS` includes your Vercel URL |
| 502 Bad Gateway | Backend not running | Check Railway/Fly logs: `railway logs` or `fly logs` |
| Cold start delay (30s) | Container slept | Add UptimeRobot ping; or use Fly.io (no sleep) |
| Groq 401 Unauthorized | API key not set | Verify `GROQ_API_KEY` in platform env vars |
| Data always fallback | Network blocked | Some platforms block outbound HTTP; test with `DEMO_MODE=false` locally first |
| TypeScript build fails | Missing env var | Add `VITE_API_BASE_URL` to Vercel env vars |
