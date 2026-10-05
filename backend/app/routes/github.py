"""
github.py — GitHub workflow API (Branch / Commit / Pull Request).

Endpoints:
  GET  /api/github/login          — Start GitHub OAuth (alias of /auth/github/login).
  GET  /api/github/callback       — Handle OAuth callback (alias of /auth/github/callback).
  POST /api/github/branches       — Create a new branch.
  POST /api/github/commits        — Commit a file change to a branch.
  POST /api/github/pull-requests  — Open a pull request.

Business logic lives in services/github_service.py.
"""
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
from app.models.schemas import BranchRequest, CommitRequest, PullRequestRequest
from app.routes.auth import _require_token
from app.services import github_service
from app.services.session_service import (
    create_oauth_state,
    create_session,
    validate_and_consume_state,
)

router = APIRouter(prefix="/api/github", tags=["GitHub Workflow"])

# ── GET /api/github/login ──────────────────────────────────────────────────────

@router.get(
    "/login",
    summary="Start GitHub OAuth login",
    description=(
        "Redirects the browser to GitHub's authorization page. "
        "Alias of GET /auth/github/login — use whichever URL suits your flow."
    ),
)
async def github_login_alias():
    """Alias route so /api/github/login also appears in Swagger."""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "GitHub OAuth is not configured. "
                "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file."
            ),
        )
    state = create_oauth_state()
    # Use /api/github/callback as redirect_uri so this alias is self-contained
    redirect_uri = GITHUB_REDIRECT_URI.replace(
        "/auth/github/callback", "/api/github/callback"
    )
    params = urllib.parse.urlencode(
        {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": GITHUB_SCOPES,
            "state": state,
        }
    )
    return RedirectResponse(url=f"{GITHUB_AUTHORIZE_URL}?{params}")


# ── GET /api/github/callback ───────────────────────────────────────────────────

@router.get(
    "/callback",
    summary="GitHub OAuth callback",
    description=(
        "GitHub redirects here after the user authorizes the app. "
        "The authorization code is exchanged for a token server-side, "
        "a session cookie is set, and the browser is redirected to /docs."
    ),
)
async def github_callback_alias(
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
):
    """Alias callback that mirrors /auth/github/callback logic."""
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
    if not validate_and_consume_state(state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "OAuth state mismatch or expired. "
                "Please start the login flow again via /api/github/login"
            ),
        )

    access_token = await github_service.exchange_code_for_token(code)
    session_id = create_session(access_token)

    response = RedirectResponse(
        url="/docs",
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        max_age=SESSION_COOKIE_MAX_AGE,
        samesite="lax",
        secure=False,
    )
    return response


# ── POST /api/github/branches ──────────────────────────────────────────────────

@router.post(
    "/branches",
    summary="Create a new GitHub branch",
    description="Accepts a BranchRequest and will create a branch via the GitHub API.",
)
async def create_branch(request: BranchRequest, req: Request) -> dict:
    """Create a new branch from a base branch."""
    token = _require_token(req)
    return await github_service.create_branch(
        token=token,
        owner=request.owner,
        repo=request.repo,
        branch_name=request.branch_name,
        from_branch=request.from_branch,
    )


# ── POST /api/github/commits ───────────────────────────────────────────────────

@router.post(
    "/commits",
    summary="Commit a file change to a branch",
    description="Accepts a CommitRequest and will push the change via the GitHub API.",
)
async def create_commit(request: CommitRequest, req: Request) -> dict:
    """Commit a file change to a branch."""
    token = _require_token(req)
    return await github_service.create_commit(
        token=token,
        owner=request.owner,
        repo=request.repo,
        branch=request.branch,
        file_path=request.file_path,
        content=request.new_content,
        message=request.message,
    )


# ── POST /api/github/pull-requests ────────────────────────────────────────────

@router.post(
    "/pull-requests",
    summary="Open a pull request",
    description="Accepts a PullRequestRequest and will create a PR via the GitHub API.",
)
async def create_pull_request(request: PullRequestRequest, req: Request) -> dict:
    """Open a pull request."""
    token = _require_token(req)
    return await github_service.create_pull_request(
        token=token,
        owner=request.owner,
        repo=request.repo,
        title=request.title,
        head_branch=request.head_branch,
        base_branch=request.base_branch,
        body=request.body,
    )
