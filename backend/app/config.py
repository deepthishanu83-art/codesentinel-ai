import os
import secrets
from dotenv import load_dotenv

load_dotenv()

# ── Application ────────────────────────────────────────────────────────────────
APP_NAME = "CodeSentinel AI"
APP_VERSION = "0.1.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# ── Server ─────────────────────────────────────────────────────────────────────
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# ── GitHub OAuth ───────────────────────────────────────────────────────────────
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://127.0.0.1:8000/api/github/callback",
)
GITHUB_API_URL = os.getenv("GITHUB_API_URL", "https://api.github.com")
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"

# Scopes: read repos (public + private) and read user email
GITHUB_SCOPES = "repo user:email"

# ── Session ────────────────────────────────────────────────────────────────────
# Fallback to a random secret if not set — will change on every restart (OK for dev)
SESSION_SECRET = os.getenv("SESSION_SECRET", secrets.token_hex(32))
SESSION_COOKIE_NAME = "codesentinel_session"
SESSION_COOKIE_MAX_AGE = 3600  # 1 hour

# ── AI Service ─────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── AI Engine (Member 2) ───────────────────────────────────────────────────────
# AI_PROVIDER: gemini | openai | anthropic | mock
# Falls back to "mock" so the engine runs locally without a real API key.
AI_PROVIDER = os.getenv("AI_PROVIDER", "mock")
AI_MODEL = os.getenv("AI_MODEL", "gemini-2.0-flash")
AI_API_KEY = os.getenv("AI_API_KEY", "")
