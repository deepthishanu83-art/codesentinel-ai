"""
session_service.py

Server-side session store using in-memory dicts.

- OAuth state tokens are stored to prevent CSRF attacks.
- Session IDs (stored in an HttpOnly cookie) map to GitHub access tokens.
- Access tokens NEVER leave the server.

Note: In-memory storage resets on server restart.
      A database-backed store will be introduced in a later step.
"""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

# ── In-memory stores ───────────────────────────────────────────────────────────

# state -> expiry  (used to validate GitHub OAuth callback CSRF tokens)
_oauth_states: dict[str, datetime] = {}

# session_id -> {"access_token": str, "expires_at": datetime}
_sessions: dict[str, dict] = {}

# ── Constants ──────────────────────────────────────────────────────────────────

_STATE_TTL_SECONDS = 300   # OAuth state is valid for 5 minutes
_SESSION_TTL_SECONDS = 3600  # Sessions expire after 1 hour


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


# ── OAuth state (CSRF protection) ──────────────────────────────────────────────

def create_oauth_state() -> str:
    """Generate a cryptographically random state token and store it."""
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = _utcnow() + timedelta(seconds=_STATE_TTL_SECONDS)
    return state


def validate_and_consume_state(state: str) -> bool:
    """
    Return True if the state exists and has not expired, then delete it.
    Returns False (and does NOT raise) so the caller decides the HTTP response.
    """
    expiry = _oauth_states.pop(state, None)
    if expiry is None:
        return False
    if _utcnow() > expiry:
        return False
    return True


# ── Session management ─────────────────────────────────────────────────────────

def create_session(access_token: str) -> str:
    """
    Store an access token server-side and return a session ID.
    The caller sets this session ID in an HttpOnly cookie — the token
    itself is never sent to the client.
    """
    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = {
        "access_token": access_token,
        "expires_at": _utcnow() + timedelta(seconds=_SESSION_TTL_SECONDS),
    }
    return session_id


def get_token_from_session(session_id: str) -> Optional[str]:
    """
    Look up the access token for a session ID.
    Returns None if the session does not exist or has expired.
    """
    session = _sessions.get(session_id)
    if session is None:
        return None
    if _utcnow() > session["expires_at"]:
        _sessions.pop(session_id, None)
        return None
    return session["access_token"]


def delete_session(session_id: str) -> None:
    """Invalidate a session (logout)."""
    _sessions.pop(session_id, None)
