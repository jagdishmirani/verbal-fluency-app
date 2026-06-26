# Verbal Fluency App

A local-first verbal fluency and word recall app for curating useful but less frequently used words, then drilling them so they come back into working memory.

This first version is for personal local use on your laptop. It does **not** use a dictionary API and it does **not** require authentication. The code is still structured so future versions can add login, user profiles, cloud hosting, and multi-user word lists without a major redesign.

---

## What changed in this version

This version adds three enhancements:

1. **Duplicate-word prevention**
   - The app checks whether a word already exists as soon as you enter the word.
   - The rest of the curation form stays locked until the word is confirmed to be new.
   - Duplicate detection ignores capitalization and extra spacing, so `Lucid`, `lucid`, and `  lucid  ` are treated as the same word.
   - The backend also blocks duplicate submissions, so duplicates are prevented even if the frontend is bypassed.

2. **Rotating zen-like backgrounds**
   - The app now uses a folder of local background assets.
   - A different calm background is chosen each time the app page loads.
   - Background files are stored in:

   ```text
   frontend/public/backgrounds
   ```

3. **Windows startup agent / launcher**
   - A new launcher starts the backend, starts the frontend, waits for them to respond, and opens the app in your default browser.
   - Use this after first-time setup is complete:

   ```bat
   start_app.bat
   ```

---

## The most important thing to know

You do **not** need to repeat the full installation every time you use the app.

There are two kinds of steps:

1. **First-time setup** — do this once after downloading or extracting the project.
2. **Everyday startup** — do this each time you want to use the app after setup is complete.

Because you have already installed the dependencies, you normally only need the **Everyday startup** steps.

---

## What the app does

- **Curation mode** lets you add a word, part of speech, definition, and optional example sentence.
- The app checks for duplicate words before you enter the definition, part of speech, or example sentence.
- **Drill mode** shows one pseudo-random word card at a time.
- Words shown fewer times are more likely to appear.
- The app avoids showing the exact same word twice in a row when more than one word exists.
- The local SQLite database persists after closing and reopening the app.
- Each word record stores an `owner_id`, so future versions can associate words with real user accounts.

---

## Project structure

```text
verbal-fluency-app/
├── start_app.bat                  # Windows launcher: starts backend, frontend, and browser
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment-aware settings
│   │   ├── database.py            # SQLAlchemy SQLite setup
│   │   ├── main.py                # FastAPI app and CORS setup
│   │   ├── migrations.py          # Lightweight local SQLite schema updates
│   │   ├── models.py              # Word database model
│   │   ├── schemas.py             # Request/response validation
│   │   ├── services.py            # Weighted drill-word selection logic
│   │   └── routers/
│   │       └── words.py           # Word API endpoints
│   ├── data/                      # Local SQLite database is created here
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── globals.css            # UI styling
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main app shell and background selection
│   ├── components/
│   │   ├── CurationForm.tsx        # Duplicate check and curation form
│   │   ├── DrillCard.tsx
│   │   └── ModeTabs.tsx
│   ├── lib/
│   │   └── api.ts                 # Frontend API client
│   ├── public/
│   │   └── backgrounds/           # Local zen-like background images
│   ├── .env.local.example
│   ├── .npmrc                     # Uses the public npm registry
│   └── package.json
├── scripts/
│   ├── launch_app.py              # Startup agent used by start_app.bat
│   └── verify_backend.py
└── README.md
```

---

## Requirements

Install these before running the app:

- **Python 3.11 or newer**
- **Node.js 20 or newer**
- **npm**, which is usually installed with Node.js

This project was built and verified with Python 3.13 and Node.js 22.

Windows note: on Windows, use `py` or `python`, not `python3`. The command `python3` is common on macOS and Linux, but it often does not exist on Windows.

---

# Everyday startup on Windows

Use this section after the first-time setup has already been completed.

## Option A — recommended: use the startup agent

Open Command Prompt, go to the project folder, and run:

```bat
cd "C:\Users\foste\verbal-fluency-app"
start_app.bat
```

The startup agent should:

1. Start the backend in a new Command Prompt window.
2. Start the frontend in a new Command Prompt window.
3. Wait for both services to respond.
4. Open the app in your default browser.

The app should open at:

```text
http://127.0.0.1:3001
```

Keep the backend and frontend Command Prompt windows open while using the app.

## Option B — manual startup

Use this if you prefer to start the backend and frontend yourself, or if the startup agent fails.

You need two Command Prompt windows:

- One for the backend
- One for the frontend

Do **not** close either window while using the app.

### 1. Start the backend

Open **Command Prompt window 1** and run:

```bat
cd "C:\Users\foste\verbal-fluency-app\backend"
.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

When the backend is running correctly, you should see something like:

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

Leave this window open.

Optional backend test:

```text
http://127.0.0.1:8000/api/health
```

A `GET /favicon.ico 404 Not Found` message in the backend terminal is harmless.

### 2. Start the frontend

Open **Command Prompt window 2** and run:

```bat
cd "C:\Users\foste\verbal-fluency-app\frontend"
npm run dev -- -H 127.0.0.1 -p 3001
```

The project's `package.json` already runs Next.js with Webpack. This avoids the Windows issue where the Turbopack dev server may print `Ready` and then exit.

When the frontend is running correctly, you should see something like:

```text
▲ Next.js
- Local: http://127.0.0.1:3001
✓ Ready
```

The terminal should stay occupied. If it returns to this prompt, the frontend is not running:

```text
C:\Users\foste\verbal-fluency-app\frontend>
```

Leave this window open.

### 3. Open the app

Open this URL in your browser:

```text
http://127.0.0.1:3001
```

Use **HTTP**, not HTTPS.

Correct:

```text
http://127.0.0.1:3001
```

Incorrect:

```text
https://localhost:3000
```

---

# First-time setup on Windows

Use this section only when you are setting up the app for the first time, after extracting a fresh copy of the project, or after deleting dependencies.

The examples below assume the app is located here:

```text
C:\Users\foste\verbal-fluency-app
```

If your folder is somewhere else, replace that path with your actual folder path.

## 1. Check whether Python is installed

Open Command Prompt and run:

```bat
py --version
```

If that shows a Python version, use `py` for the virtual environment commands below.

If `py` does not work, try:

```bat
python --version
```

If neither command works, install Python first. One easy option is:

```bat
winget install Python.Python.3.14
```

After installing Python, close and reopen Command Prompt, then check again:

```bat
python --version
```

If Windows opens the Microsoft Store when you type `python` or `python3`, turn off the Python app execution aliases:

```text
Settings → Apps → Advanced app settings → App execution aliases
```

Then disable these aliases if they are enabled:

```text
python.exe
python3.exe
```

## 2. Set up the backend

```bat
cd "C:\Users\foste\verbal-fluency-app\backend"
py -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
copy .env.example .env
```

If `py` does not work but `python` does, use this instead:

```bat
python -m venv .venv
```

## 3. Set up the frontend

```bat
cd "C:\Users\foste\verbal-fluency-app\frontend"
npm config set registry https://registry.npmjs.org/
npm install
copy .env.local.example .env.local
```

The project includes this file:

```text
frontend\.npmrc
```

It points npm to the public npm registry:

```text
registry=https://registry.npmjs.org/
```

This prevents npm from trying to use an internal registry that your laptop cannot access.

## 4. Start the app

After first-time setup, use the **Everyday startup on Windows** section above.

---

# macOS / Linux setup

The app was tuned through Windows debugging, but it can also run on macOS or Linux.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev -- -H 127.0.0.1 -p 3001
```

Open:

```text
http://127.0.0.1:3001
```

---

# API endpoints

The frontend uses API calls to communicate with the backend.

```text
GET    /api/health
POST   /api/words
GET    /api/words/exists?word=lucid
GET    /api/words/count
GET    /api/words/drill
GET    /api/words/drill?exclude_id=1
GET    /api/words
DELETE /api/words/{word_id}
```

The `/api/words/exists` endpoint powers the duplicate check in the curation form.

---

# Database location and persistence

The local SQLite database is stored here by default:

```text
C:\Users\foste\verbal-fluency-app\backend\data\words.db
```

Your curated word list is stored in this database file. It should persist after:

- Closing the browser
- Stopping the frontend
- Stopping the backend
- Restarting the app
- Restarting your Windows machine

Do **not** delete this file unless you intentionally want to reset the app.

The database path is controlled by:

```text
backend\.env
```

Default value:

```env
DATABASE_URL=sqlite:///./data/words.db
```

---

# Database backup instructions

The most important file to back up is:

```text
C:\Users\foste\verbal-fluency-app\backend\data\words.db
```

That file contains your curated word list and drill history.

## Manual backup on Windows

1. Close the app or stop the backend with `Ctrl + C`.
2. Open File Explorer.
3. Go to:

```text
C:\Users\foste\verbal-fluency-app\backend\data
```

4. Copy this file:

```text
words.db
```

5. Paste it somewhere safe, such as:

```text
C:\Users\foste\Documents\verbal-fluency-backups
```

## PowerShell backup with date in filename

Open PowerShell and run:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\Documents\verbal-fluency-backups"
Copy-Item "$env:USERPROFILE\verbal-fluency-app\backend\data\words.db" "$env:USERPROFILE\Documents\verbal-fluency-backups\words-$(Get-Date -Format yyyy-MM-dd-HHmm).db"
```

This creates a backup with a name like:

```text
words-2026-06-23-1530.db
```

## How often to back up

A practical schedule:

- Back up after adding a large batch of words.
- Back up weekly if you are using the app regularly.
- Back up before replacing the project folder with a newly downloaded ZIP.

## What does not need to be backed up

You usually do **not** need to back up these folders:

```text
backend\.venv
frontend\node_modules
frontend\.next
```

Those folders can be recreated by reinstalling dependencies.

## Restore from a backup

1. Stop the backend and frontend.
2. Go to:

```text
C:\Users\foste\verbal-fluency-app\backend\data
```

3. Rename the current database as a safety copy:

```text
words.db
```

to:

```text
words-before-restore.db
```

4. Copy your backup database into the `data` folder.
5. Rename the backup copy to:

```text
words.db
```

6. Restart the backend and frontend.

---

# Reset the database

Only do this if you intentionally want to delete all curated words.

1. Stop the backend.
2. Delete:

```text
C:\Users\foste\verbal-fluency-app\backend\data\words.db
```

3. Restart the backend.

A new empty database will be created automatically.

---

# Background images

The app chooses a background from this local folder each time the page loads:

```text
frontend\public\backgrounds
```

Current backgrounds:

```text
zen-bamboo.svg
zen-ink.svg
zen-mist.svg
zen-moon.svg
zen-ripple.svg
zen-stones.svg
```

To add your own background later:

1. Put an image file in `frontend\public\backgrounds`.
2. Open `frontend\app\page.tsx`.
3. Add the new file path to the `ZEN_BACKGROUNDS` list.

Example:

```ts
"/backgrounds/my-new-background.svg"
```

---

# Troubleshooting

## `python3` was not found on Windows

Use:

```bat
py -m venv .venv
```

or:

```bat
python -m venv .venv
```

Do not use this on Windows unless your system specifically supports it:

```bat
python3 -m venv .venv
```

## npm tries to use an internal OpenAI registry

If you see a URL containing something like:

```text
packages.applied-caas-gateway1.internal.api.openai.org
```

run this from the frontend folder:

```bat
cd "C:\Users\foste\verbal-fluency-app\frontend"
npm config set registry https://registry.npmjs.org/
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm cache verify
npm install
```

## Frontend says `Ready` but immediately returns to the command prompt

This means the frontend exited. This project uses Webpack for the dev server to avoid that Turbopack issue on your Windows machine.

Run:

```bat
cd "C:\Users\foste\verbal-fluency-app\frontend"
npm run dev -- -H 127.0.0.1 -p 3001
```

If needed, you can explicitly call Webpack:

```bat
npm run dev -- --webpack -H 127.0.0.1 -p 3001
```

## Browser says `localhost refused to connect`

Use this exact URL:

```text
http://127.0.0.1:3001
```

Not:

```text
https://localhost:3000
```

Also confirm that the frontend terminal is still open and has not returned to the command prompt.

## Test whether the frontend is reachable

In a separate Command Prompt window:

```bat
curl -v http://127.0.0.1:3001
```

If it says connection refused, the frontend is not running.

## Test whether port 3001 is listening

```bat
netstat -ano | findstr :3001
```

A working frontend should show a line containing:

```text
LISTENING
```

## Backend shows `Invalid HTTP request received`

This usually means something tried to reach the backend with HTTPS instead of HTTP.

Correct backend URL:

```text
http://127.0.0.1:8000
```

Incorrect backend URL:

```text
https://127.0.0.1:8000
```

Check `frontend\.env.local` and make sure it contains:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

---

# Verify backend behavior

After backend dependencies are installed, you can run the basic backend verification script:

```bat
cd "C:\Users\foste\verbal-fluency-app\backend"
.venv\Scripts\activate
set PYTHONPATH=.
python ..\scripts\verify_backend.py
```

The script checks:

- Backend health
- Empty drill state
- Adding words
- Duplicate detection
- Optional example sentence behavior
- Word count
- Drill card retrieval
- Delete behavior

---

# Future enhancement notes

The app is intentionally local-first, but the structure leaves room for future expansion:

- Add authentication and real user accounts.
- Replace the default local `owner_id` with the logged-in user's ID.
- Move SQLite to a cloud database such as PostgreSQL.
- Add Alembic migrations for production-grade schema management.
- Add dictionary API support.
- Add import/export of word lists.
- Add spaced-repetition scoring.
- Add tagging, categories, or difficulty levels.
- Add cloud deployment with separate frontend and backend hosting.
