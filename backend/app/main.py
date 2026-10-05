"""
main.py — CodeSentinel AI FastAPI application.

Router registration order:
  /auth/*            — GitHub OAuth (Step 2)
  /api/repositories  — Real GitHub repo access (Step 2)
  /api/status        — Engine connection status
  /api/analyze       — Analysis contract (Member 2)
  /api/fixes/*       — Fix generation contract (Member 2)
  /api/github/*      — Branch/commit/PR contract (Member 3)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import analysis, auth, fixes, github, repository

app = FastAPI(
    title="CodeSentinel AI",
    description="AI-powered GitHub Code Review and Release Assistant",
    version="0.1.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# allow_credentials=True is required for the HttpOnly session cookie to be sent.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)         # /auth/*
app.include_router(repository.router)  # /api/repositories
app.include_router(analysis.router)    # /api/status  /api/analyze
app.include_router(fixes.router)       # /api/fixes/*
app.include_router(github.router)      # /api/github/*


# ── Root ───────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root() -> dict:
    """Returns basic service information and links."""
    return {
        "name":   "CodeSentinel AI",
        "status": "running",
        "docs":   "/docs",
        "login":  "/auth/github/login",
        "status_check": "/api/status",
    }


@app.get("/health", tags=["Health"])
async def health() -> dict:
    """Lightweight health check — returns HTTP 200 when the process is alive."""
    return {"status": "healthy"}
