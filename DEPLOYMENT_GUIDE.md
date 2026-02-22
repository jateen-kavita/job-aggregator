# JobSync Deployment Guide

Because this application uses a **local SQLite database** (`jobs.db`) and a Node API with an **hourly scheduled cron job** (`node-cron`), you cannot host the entire full-stack app on serverless platforms like Vercel or Netlify alone. 

Serverless platforms spin down when not in use, which would kill the cron job and wipe out the SQLite database.

Here is the proper way to host this app for free:

---

## 🚀 1. Host the Backend on Render (Free Tier)
Render supports persistent disks (for SQLite) and long-running web services (for cron jobs).

1. Push your `job-aggregator` folder to a GitHub repository.
2. Go to [Render.com](https://render.com/) and create a free account.
3. Click **New > Web Service** and connect your GitHub repo.
4. **Settings:**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Persistent Disk (Crucial for SQLite):**
   - In your Render service settings, go to "Disks".
   - Add a disk named `data`, mount it to `/data`, size 1GB.
   - Update `backend/src/db.js` in your code so `DB_PATH` points to `/data/jobs.db`.
6. Deploy! Render will give you a URL like `https://job-backend.onrender.com`.

---

## 🎨 2. Host the Frontend on Vercel or Netlify

Once your backend is live on Render, you need to point your frontend to it, and then deploy the frontend.

### Step A: Point Frontend to Backend
Open `frontend/src/services/api.js` and update `API_BASE`:
```javascript
// Change this:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// To this (replace with your actual Render URL):
const API_BASE = 'https://your-render-app-name.onrender.com/api';
```

### Step B: Deploy to Vercel (Option 1)
1. Open terminal and navigate to your frontend folder:
   ```bash
   cd ~/Desktop/job-aggregator/frontend
   ```
2. Install Vercel CLI and run it:
   ```bash
   npm i -g vercel
   vercel
   ```
3. Follow the prompts (press enter for defaults). Vercel will automatically detect Vite and use the `vercel.json` file I generated for you.

### Step C: Deploy to Netlify (Option 2)
1. In terminal, navigate to your frontend folder:
   ```bash
   cd ~/Desktop/job-aggregator/frontend
   ```
2. Install Netlify CLI and deploy:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```
3. Follow prompts. Netlify will use the `netlify.toml` file I generated for you.

---
*The app code is now fully prepared in the `job-aggregator` folder on your Desktop!*
