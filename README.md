# SAT Gamified Practice

A demo React app for gamified SAT practice with Practice Rush, Exam Mode, and a Dashboard.
This repo includes:
- Dark mode (default) with light mode toggle.
- Local "accounts" demo (stored in browser `localStorage`) so users can sign up and track progress per account (demo only).
- Adaptive question selection: the app favors questions from skills where the user has lower accuracy.
- Sample `public/questions.json` — replace with OpenSAT or your own dataset.
- Instructions to integrate Supabase (recommended) for real auth & persistent cross-device progress.

---

## Quick start (for non-coders)

### 1) Install Node.js
Download and install Node.js (LTS) from https://nodejs.org. This includes `npm`.

### 2) Prepare the project locally
Unzip the project, then in a terminal run:
```bash
cd sat-gamified-practice
npm install
npm start
```
The app will open at http://localhost:3000.

### 3) Create a GitHub repo & push (step-by-step)
Replace `your-github-username` and `your-repo-name` below.

```bash
# in project folder
git init
git add .
git commit -m "Initial commit: SAT Gamified Practice"
git branch -M main
git remote add origin https://github.com/your-github-username/your-repo-name.git
git push -u origin main
```

If you don't have a GitHub repo yet:
1. Go to https://github.com and create a new repository (name it `sat-gamified-practice`).
2. Then run the commands above (use the URL GitHub shows after creating the repo).

### 4) Deploy to Vercel (one-click)
1. Create a free account at https://vercel.com and connect your GitHub account.
2. Click **New Project → Import Git Repository** and pick your repo.
3. Use the detected build settings (Create React App).
4. Add Environment Variables if you plan to enable Supabase (see below).
5. Click **Deploy** — you’ll get a public URL.

---

## Accounts & Persistent Storage

This demo uses browser `localStorage` to store:
- Registered users (username/password) — **not secure**; demo only.
- Per-user progress stored under `sat_progress_{userId}`.

### Production-ready (recommended)
To make real accounts and cross-device progress, integrate Supabase or Firebase:
- Create a Supabase project, enable Auth, create a `progress` table.
- Set environment variables in Vercel:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`
- Update the client code to use `@supabase/supabase-js` (example scaffold included in `src/supabaseClient.js`).

Example Supabase table SQL:
```sql
create table progress (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  points int default 0,
  streak int default 0,
  skill_stats jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
```

---

## How adaptive selection works (brief)
The app tracks attempts and correct counts per skill. When selecting a next question, it:
- Calculates accuracy per skill (correct/attempts).
- Builds weights inversely proportional to accuracy (weaker skills get higher weight).
- Samples a question by skill-weighted random selection.

---

## Files you may want to edit
- `public/questions.json` — replace with your question bank (OpenSAT JSON or export).
- `src/utils.js` — core progress & sampling logic.
- `src/auth.js` — demo auth UI and localStorage behavior.
- `src/supabaseClient.js` — scaffold for Supabase integration.

---

## Need help?
Tell me:
- If you'd like me to hook up Supabase (I can provide exact SQL & code edits).
- Or if you want me to create the GitHub repo for you (I cannot access your GitHub, but I can produce exact commands and files).
