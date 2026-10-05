"""
repository.py — Real GitHub repository endpoints.

All endpoints require a valid session cookie (set by /auth/github/callback).
No mock data. All responses come directly from the GitHub REST API.
"""
from fastapi import APIRouter, HTTPException, Query, Request, status

from app.config import SESSION_COOKIE_NAME
from app.services import github_service
from app.services.session_service import get_token_from_session

router = APIRouter(prefix="/api", tags=["Repositories"])


# ── GET /api/repositories ──────────────────────────────────────────────────────

@router.get(
    "/repositories",
    summary="List authenticated user's repositories",
    description=(
        "Returns real GitHub repositories accessible to the logged-in user, "
        "sorted by most recently updated. Supports pagination."
    ),
)
async def list_repositories(
    request: Request,
    per_page: int = Query(default=30, ge=1, le=100, description="Results per page"),
    page: int = Query(default=1, ge=1, description="Page number"),
):
    token = _require_token(request)
    repos = await github_service.get_user_repositories(token, per_page=per_page, page=page)
    return {
        "count": len(repos),
        "page": page,
        "per_page": per_page,
        "repositories": repos,
    }


# ── GET /api/repositories/{owner}/{repo} ───────────────────────────────────────

@router.get(
    "/repositories/{owner}/{repo}",
    summary="Get a specific repository",
    description=(
        "Returns full metadata for a specific GitHub repository. "
        "The user must have read access to the repository."
    ),
)
async def get_repository(request: Request, owner: str, repo: str):
    token = _require_token(request)
    return await github_service.get_repository(token, owner, repo)


# ── Shared helper ──────────────────────────────────────────────────────────────

def _require_token(request: Request) -> str:
    """
    Retrieve the GitHub access token from the server-side session.
    Raises HTTP 401 if the session is missing or expired.
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
