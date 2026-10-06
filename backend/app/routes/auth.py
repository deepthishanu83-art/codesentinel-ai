import os
import urllib.parse

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse

from app.config import (
    GITHUB_AUTHORIZE_URL,
    GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI,
    GITHUB_SCOPES,
    SESSION_COOKIE_MAX_AGE,
    SESSION_COOKIE_NAME,
)
from app.services import github_service
from app.services.session_service import (
    create_oauth_state,
    create_session,
    delete_session,
    get_token_from_session,
    validate_and_consume_state,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Step 1: redirect to GitHub ─────────────────────────────────────────────────

@router.get(
    "/github/login",
    summary="Start GitHub OAuth flow",
    description="Redirects the browser to GitHub's authorization page.",
)
async def github_login():
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "GitHub OAuth is not configured. "
                "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file."
            ),
        )

    state = create_oauth_state()
    params = urllib.parse.urlencode(
        {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": GITHUB_REDIRECT_URI,
            "scope": GITHUB_SCOPES,
            "state": state,
        }
    )
    return RedirectResponse(url=f"{GITHUB_AUTHORIZE_URL}?{params}")


# ── Step 2: GitHub callback ────────────────────────────────────────────────────

@router.get(
    "/github/callback",
    summary="GitHub OAuth callback",
    description=(
        "GitHub redirects here after the user authorizes the app. "
        "The authorization code is exchanged for a token server-side."
    ),
)
async def github_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
):
    # User clicked "Deny" on GitHub's authorization page
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub authorization denied: {error_description or error}",
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'code' parameter in GitHub callback.",
        )

    if not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'state' parameter in GitHub callback.",
        )

    # CSRF check — state must match what we generated in /login
    if not validate_and_consume_state(state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "OAuth state mismatch or expired. "
                "Please start the login flow again via /auth/github/login"
            ),
        )

    # Exchange code → access token (client secret stays on the server)
    access_token = await github_service.exchange_code_for_token(code)

    # Store token server-side; browser only receives the session ID
    session_id = create_session(access_token)

    # Redirect to the frontend dashboard so the user lands in the app.
    # The session cookie is set on the redirect response; the browser will
    # include it on all subsequent /auth/* and /api/* requests through the
    # Vite dev-server proxy.
    frontend_url = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173")
    response = RedirectResponse(
        url=f"{frontend_url}/dashboard",
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,          # JavaScript cannot read this cookie
        max_age=SESSION_COOKIE_MAX_AGE,
        samesite="lax",
        secure=False,           # Switch to True when running behind HTTPS
    )
    return response


# ── Current user ───────────────────────────────────────────────────────────────

@router.get(
    "/me",
    summary="Get authenticated user profile",
    description="Returns the GitHub profile of the currently logged-in user.",
)
async def get_current_user(request: Request):
    token = _require_token(request)
    return await github_service.get_authenticated_user(token)


# ── Logout ─────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    summary="Log out",
    description="Invalidates the server-side session and clears the session cookie.",
)
async def logout(request: Request):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        delete_session(session_id)

    response = Response(
        content='{"status":"logged_out"}',
        media_type="application/json",
    )
    response.delete_cookie(SESSION_COOKIE_NAME)
    return response


# ── Shared helper ──────────────────────────────────────────────────────────────

def _require_token(request: Request) -> str:
    """
    Extract the GitHub access token from the server-side session.
    Raises HTTP 401 if the session cookie is missing or the session has expired.
    """
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please visit /auth/github/login",
        )
    token = get_token_from_session(session_id)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please visit /auth/github/login",
        )
    return token
