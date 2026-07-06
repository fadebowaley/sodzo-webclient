# Sodzo WebClient — Project Summary

## Overview

A React-based web dashboard for **The Sword of the Spirit Ministries**, providing church/ministry management tools including form modules, network hierarchy, donations, e-commerce, calendar, team management, and compliance reporting.

- **Live URL**: `https://stg.saby.ai`
- **API Backend**: `https://api.saby.ai/v1`
- **GitHub (upstream)**: `fadebowaley/sodzo-webclient`
- **GitHub (fork)**: `4MHARK/sodzo-webclient`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 (dark mode via `class` strategy) |
| Routing | React Router v7 |
| Data fetching | @tanstack/react-query v5 |
| HTTP client | Axios (with interceptors for auth, rate limiting, logging) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Local DB | Dexie.js (IndexedDB wrapper) |
| Auth | JWT access + refresh tokens, HttpOnly cookies |
| Notifications | react-hot-toast |
| Deployment | Docker + GitHub Actions CI/CD |

---

## Architecture

### Auth Flow

```
AuthContext (state machine)
  ANONYMOUS → AUTHENTICATED → REFRESHING → SESSION_EXPIRED
       ↑                                       │
       └───────────── LOGGING_OUT ←────────────┘

Tokens: access token (in-memory only), refresh token (localStorage + memory)
API interceptors: auto-attach Bearer token, auto-refresh on 401, rate-limit backoff
```

### Route Structure

```
/                     Landing page (public)
/auth                 Auth page (public)
/about, /policy       Placeholder pages (public)

Protected routes (under Layout with sidebar/header):
  /dashboard          Metrics dashboard with charts
  /projects           Form modules dashboard
  /projects/submissions   Module submissions
  /module-report/:id      Tenant-aware report table
  /network            Node hierarchy management (tree view, CRUD)
  /calendar           Calendar events
  /emails             Email center
  /storage            Cloud storage
  /reports            Reports (leaderboard + compliance module reports)
  /store              E-commerce store
  /settings           User settings
  /team               Team member management
  /admin              Admin settings (owner-only)
  /givings            Donations (payment link, QR, bank transfer, USSD, reports)
  /user               User Compliance (NEW — see below)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | All route definitions |
| `src/contexts/AuthContext.tsx` | Auth state machine, login/logout, token management (~1200 lines) |
| `src/utils/api.ts` | Axios instance with interceptors, refresh logic, rate limiting |
| `src/utils/dbService.ts` | IndexedDB schema (Dexie.js) — 8 tables |
| `src/components/ProtectedRoute.tsx` | Route guard, checks auth state |
| `src/components/Layout/Layout.tsx` | App shell (sidebar + header + Outlet) |
| `src/components/Layout/Sidebar.tsx` | Navigation sidebar |
| `src/components/Layout/MobileLayout.tsx` | Mobile-optimized layout |

---

## What We Built: User Compliance Page

### Files Changed

| File | Change |
|------|--------|
| `src/pages/User.tsx` | **NEW** — User compliance report page (401 lines) |
| `src/App.tsx` | Added route `/user` with ProtectedRoute wrapper |
| `src/components/Layout/Sidebar.tsx` | Added `Users` icon import, "User" nav link |

### Page Features

- **Summary cards**: Compliant / Non-Compliant / Pending counts
- **Search bar**: Filter by name, email, or role
- **Sortable table**: Click column headers to sort (Name, Email, Roles, Status, Last Updated)
- **Status badges**: Green (Compliant), Red (Non-Compliant), Yellow (Pending)
- **Mock data mode**: `USE_MOCK = true` at top of file — shows 8 demo users
- **Real data mode**: Set `USE_MOCK = false` to fetch from `http://localhost:3000/reports/baseline-intelligence/compliance`
- **All states handled**: Loading spinner, error with retry button, empty state

### How to Switch to Real Data

In `src/pages/User.tsx`, change line 8:
```tsx
const USE_MOCK = false;  // was true
```

The page will then call `http://localhost:3000/reports/baseline-intelligence/compliance` via `fetch()`.

---

## Git Workflow

### Branch Setup

```
LOCAL                              FORK (4MHARK)              UPSTREAM (fadebowaley)
─────                              ─────────────              ──────────────────────
mark        (working branch)  →    origin/mark
proddy      (mirror)          →    origin/proddy      ←──    upstream/proddy
```

### Daily Workflow

```bash
# 1. Start of day — sync with upstream
git checkout proddy
git pull upstream proddy

git checkout mark
git merge proddy
git push origin mark

# 2. Create feature branch
git checkout -b feat/my-feature

# 3. Work, commit, push
git add <files>
git commit -m "feat: description"
git push -u origin feat/my-feature

# 4. Open PR on GitHub
# From: 4MHARK/feat/my-feature → To: fadebowaley/proddy
```

---

## Getting Started (New Developer)

```bash
# Clone the fork
git clone git@github.com:4MHARK/sodzo-webclient.git
cd sodzo-webclient

# Add upstream
git remote add upstream https://github.com/fadebowaley/sodzo-webclient.git
git fetch upstream

# Setup branches
git checkout -b proddy upstream/proddy
git checkout -b mark origin/mark

# Install and run
npm install
npm run dev
# Opens at http://localhost:5173
```

### Prerequisites
- Node.js >= 18
- npm >= 9
- A browser with ad blocker disabled for localhost (lucide-react files get blocked)

### Environment
- `.env.local` — set `VITE_API_BASE` if using a local backend
- No `.env` file needed — defaults to `https://api.saby.ai/v1`

---

## Current Branches

| Branch | Commit | Notes |
|--------|--------|-------|
| `mark` | `ecb628a` | Personal working branch, synced with upstream |
| `proddy` | `ecb628a` | Mirrors upstream/proddy |
| `feat/user-compliance` | `cdbb03d` | Merged PR #22 |

---

*Last updated: 2026-07-04*
