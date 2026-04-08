# 💩 The Shit Tracker

A privacy-first dashboard tracking daily bowel movements for 5 friends across an entire year. No cookies, no analytics, no tracking — just interactive Recharts visualizations hosted on GitHub Pages.

Built with **Vite + React + Recharts + PapaParse**.

---

## 📁 Project Structure

```
shit-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← Auto-deploys to GitHub Pages on every push
├── public/
│   └── data_shit.csv         ← THE DATA FILE (edit this to update the dashboard!)
├── src/
│   ├── App.jsx               ← Main dashboard component
│   ├── index.css              ← Global styles
│   └── main.jsx               ← React entry point
├── index.html                 ← HTML shell
├── package.json               ← Dependencies
├── vite.config.js             ← Build config (⚠️ set your repo name here)
└── README.md                  ← This file
```

---

## 🚀 Complete Setup Guide (from zero)

### Prerequisites

You need **two things** installed on your computer:

1. **Git** — [Download here](https://git-scm.com/downloads)
2. **Node.js** (version 18 or higher) — [Download here](https://nodejs.org/) (pick the LTS version)

To check if they're installed, open a terminal and run:
```bash
git --version    # should print something like "git version 2.x.x"
node --version   # should print something like "v20.x.x"
npm --version    # should print something like "10.x.x"
```

---

### Step 1: Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name the repository: `shit-tracker` (or whatever you prefer)
3. Set it to **Public** (GitHub Pages only works on public repos for free accounts)
4. Do **NOT** check "Add a README" or anything else — leave it empty
5. Click **Create repository**
6. Keep this page open — you'll need the URL (something like `https://github.com/YOUR-USERNAME/shit-tracker.git`)

---

### Step 2: Download the project files and push them

Open a terminal on your computer and run these commands one by one:

```bash
# 1. Go to a folder where you want the project (e.g. your Desktop)
cd ~/Desktop

# 2. Create the project folder and go inside it
mkdir shit-tracker
cd shit-tracker

# 3. Initialize git
git init
git branch -M main
```

Now **copy all the project files** (the ones I gave you) into this `shit-tracker/` folder. The folder should look exactly like the "Project Structure" above.

Then continue in the terminal:

```bash
# 4. Connect to your GitHub repo (replace YOUR-USERNAME with your actual username)
git remote add origin https://github.com/YOUR-USERNAME/shit-tracker.git

# 5. Install dependencies (this creates the node_modules folder)
npm install

# 6. Test it locally (optional but recommended!)
npm run dev
# This starts a local server — open http://localhost:5173/shit-tracker/ in your browser
# Press Ctrl+C to stop when you're done checking

# 7. Add all files, commit, and push
git add .
git commit -m "Initial commit: shit tracker dashboard"
git push -u origin main
```

---

### Step 3: Enable GitHub Pages

1. Go to your repo on GitHub: `https://github.com/YOUR-USERNAME/shit-tracker`
2. Click **Settings** (tab at the top)
3. In the left sidebar, click **Pages**
4. Under **Source**, select **GitHub Actions**
5. That's it! The workflow will trigger automatically

---

### Step 4: Wait for deployment

1. Go to the **Actions** tab in your repo
2. You should see a workflow running called "Deploy to GitHub Pages"
3. Wait for it to finish (green checkmark) — usually takes 1-2 minutes
4. Your site is now live at: **`https://YOUR-USERNAME.github.io/shit-tracker/`**

---

## 📝 How to Update the Data

This is the part you'll do regularly! Just edit the CSV file:

### Option A: Edit directly on GitHub (easiest)

1. Go to your repo on GitHub
2. Navigate to `public/data_shit.csv`
3. Click the **pencil icon** (✏️) to edit
4. Add new rows at the bottom, e.g.:
   ```
   2026-04-08,2,1,1,2,1,7
   2026-04-09,3,0,1,1,2,7
   ```
5. Click **Commit changes** at the bottom
6. The site will automatically rebuild and redeploy (takes ~1-2 min)

### Option B: Edit locally and push

1. Open `public/data_shit.csv` in any text editor or Excel
2. Add new rows at the bottom
3. In the terminal:
   ```bash
   cd ~/Desktop/shit-tracker
   git add public/data_shit.csv
   git commit -m "Update data through April 9"
   git push
   ```
4. The GitHub Action will auto-deploy

### CSV Format

The CSV must follow this exact format:
```
Date,Alessio,Andrea,Francesco,Jacopo,Luca,Sum
2026-01-04,1,1,1,2,3,8
```

- **Date**: `YYYY-MM-DD` format
- **Each person**: integer (0, 1, 2, 3, ...)
- **Sum**: total for the day (the dashboard also calculates this, but keep it for compatibility)
- No extra spaces, no empty lines at the end

---

## ⚠️ Important: Repository Name

If your GitHub repo is named something **other** than `shit-tracker`, you must update `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  base: '/YOUR-ACTUAL-REPO-NAME/',  // ← change this
})
```

Then commit and push the change.

---

## 🖥️ Local Development

```bash
npm install      # Install dependencies (first time only)
npm run dev      # Start dev server at http://localhost:5173/shit-tracker/
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview the production build locally
```

---

## 🔒 Privacy

- **Zero tracking**: No Google Analytics, no Meta Pixel, no cookies, nothing
- **Static site**: No server, no database, no backend
- **All data is in the CSV**: Nothing is collected from visitors
- **GitHub Pages**: Served directly from GitHub's CDN
