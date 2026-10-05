# CodeSentinel AI

> **AI-powered GitHub Code Review and Release Assistant**

CodeSentinel AI automatically reviews your GitHub repositories, detects bugs, security vulnerabilities, and code smells, generates AI-powered fixes, and guides the entire release cycle — from analysis to pull request creation and deployment risk assessment.

---

## Intended Workflow

```
GitHub Login
    ↓
Repository Selection
    ↓
Real Repository Access (GitHub API)
    ↓
Code Analysis  (bugs · security · code smells)
    ↓
AI Explanation  (human-readable summaries per issue)
    ↓
AI Fix Generation  (concrete patch suggestions)
    ↓
Validation  (automated tests / linting)
    ↓
README Generation / Update
    ↓
Create GitHub Branch
    ↓
Commit Changes
    ↓
Create Pull Request
    ↓
Release Risk Assessment
    ↓
Deployment through CI/CD
```

---

## Project Structure

```
codesentinel-ai/
├── frontend/               # UI (added in a later step)
├── backend/
│   ├── requirements.txt
│   ├── .env.example        # Copy to .env and fill in secrets
│   └── app/
│       ├── main.py         # FastAPI application entry point
│       ├── config.py       # Environment-variable configuration
│       ├── routes/
│       │   ├── auth.py         # GitHub OAuth login / callback / logout
│       │   ├── repository.py   # List & fetch real GitHub repositories
│       │   ├── analysis.py     # (Step 4)
│       │   ├── fixes.py        # (Step 5)
│       │   └── github.py       # (Step 6)
│       ├── services/
│       │   ├── github_service.py    # All GitHub REST API calls
│       │   ├── session_service.py   # Server-side session / token store
│       │   ├── analyzer_service.py  # (Step 4)
│       │   ├── ai_service.py        # (Step 5)
│       │   └── fix_service.py       # (Step 5)
│       └── models/
├── analyzer/               # Static-analysis tooling (added later)
├── .github/
│   └── workflows/          # CI/CD pipelines
├── .gitignore
└── README.md
```

---

## Getting Started

### 1 — Prerequisites

| Tool | Version |
|------|---------|
| Python | ≥ 3.11 |
| pip | latest |
| A GitHub account | — |

### 2 — Create a virtual environment

```powershell
# PowerShell (Windows)
python -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3 — Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4 — Create a GitHub OAuth App

> This step is required for real GitHub authentication.

1. Go to **https://github.com/settings/developers**
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in:

| Field | Value |
|-------|-------|
| **Application name** | CodeSentinel AI (Local) |
| **Homepage URL** | `http://localhost:8000` |
| **Authorization callback URL** | `http://localhost:8000/auth/github/callback` |

4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy the secret immediately

### 5 — Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:

```env
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
SESSION_SECRET=<run: python -c "import secrets; print(secrets.token_hex(32))">
```

> ⚠️ Never commit `.env` to version control. It is already in `.gitignore`.

### 6 — Run the backend

```bash
# From the backend/ directory with venv active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Testing the GitHub OAuth Flow

### Step 1 — Trigger login

Open your browser and visit:

```
http://localhost:8000/auth/github/login
```

You will be redirected to GitHub's authorization page. Click **"Authorize"**.

### Step 2 — Callback

GitHub redirects back to `http://localhost:8000/auth/github/callback`. The backend:
- Validates the CSRF state token
- Exchanges the code for an access token (server-to-server)
- Stores the token in a server-side session
- Sets an `HttpOnly` session cookie in your browser

You will see:
```json
{"status": "authenticated", "message": "GitHub login successful.", "next": "/auth/me"}
```

### Step 3 — Verify your identity

```
http://localhost:8000/auth/me
```

Returns your real GitHub profile (login, name, avatar, repo counts).

### Step 4 — Fetch your real repositories

```
http://localhost:8000/api/repositories
```

Returns your actual GitHub repositories with:
- `id`, `name`, `full_name`
- `private` (boolean)
- `default_branch`
- `html_url`
- `language`, `description`, `stargazers_count`

### Step 5 — Fetch a specific repository

```
http://localhost:8000/api/repositories/{your-username}/{repo-name}
```

### Step 6 — Open Swagger UI

```
http://localhost:8000/docs
```

All endpoints are documented and testable in the interactive UI.

---

## API Endpoints (Step 2)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check |
| `GET` | `/auth/github/login` | Start GitHub OAuth (redirects to GitHub) |
| `GET` | `/auth/github/callback` | GitHub OAuth callback (sets session cookie) |
| `GET` | `/auth/me` | Current user's GitHub profile |
| `POST` | `/auth/logout` | Invalidate session |
| `GET` | `/api/repositories` | List authenticated user's repositories |
| `GET` | `/api/repositories/{owner}/{repo}` | Get specific repository metadata |

---

## Security Notes

- The **GitHub Client Secret** never leaves the server
- The **GitHub Access Token** is stored server-side only — never sent to the browser
- The browser receives only a session ID in an `HttpOnly` cookie (JavaScript cannot read it)
- OAuth state tokens are validated to prevent CSRF attacks
- Sessions expire after 1 hour

---

## Roadmap

| Step | Feature | Status |
|------|---------|--------|
| 1 | Project foundation + FastAPI skeleton | ✅ Done |
| 2 | GitHub OAuth login + real repository access | ✅ Done |
| 3 | Repository selection UI + file tree | 🔜 Next |
| 4 | Code analysis (bugs · security · smells) | 🔜 Planned |
| 5 | AI explanations & fix generation | 🔜 Planned |
| 6 | Branch · commit · pull request via GitHub API | 🔜 Planned |
| 7 | README generation / update | 🔜 Planned |
| 8 | Release risk assessment | 🔜 Planned |
| 9 | CI/CD deployment pipeline | 🔜 Planned |

---

## License

MIT
=======
## Hi there 👋

<!--
**deepthishanu83-art/deepthishanu83-art** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->
>>>>>>> 9b0690c1a9816bee1759c9c4b66f071d3396c0ee
