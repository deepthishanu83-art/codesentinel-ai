"""
github.py — GitHub workflow API contract (Branch / Commit / Pull Request).

Endpoints (contract only — engine not yet connected):
  POST /api/github/branches       — Create a new branch.
  POST /api/github/commits        — Commit a file change to a branch.
  POST /api/github/pull-requests  — Open a pull request.

Business logic will live in services/github_service.py (Member 3).
"""
from fastapi import APIRouter, Request
from app.models.schemas import BranchRequest, CommitRequest, PullRequestRequest
from app.services import github_service
from app.routes.auth import _require_token

router = APIRouter(prefix="/api/github", tags=["GitHub Workflow"])

_ENGINE_NOT_CONNECTED = {
    "status": "engine_not_connected",
    "message": (
        "The GitHub workflow engine is not connected yet. "
        "This endpoint will be fully operational once the "
        "Member 3 integration is complete."
    ),
}


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
        content=request.content,
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
        body=request.body if hasattr(request, "body") else "",
    )
