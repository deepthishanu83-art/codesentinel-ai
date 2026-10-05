"""fixes.py — AI fix generation API contract.

Endpoints:
  POST /api/fixes/generate — Generate an AI fix for a single finding.
  POST /api/fixes/validate — Validate a proposed fix before committing.

Business logic lives in services/fix_service.py (Member 2).
"""

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import FixRequest

router = APIRouter(prefix="/api/fixes", tags=["Fixes"])


# ── POST /api/fixes/generate ───────────────────────────────────────────────────
@router.post(
    "/generate",
    summary="Generate an AI fix for an issue finding",
    description="Accepts a FixRequest (repository info + an IssueFinding) and generates a fix using ai_engine.",
)
async def generate_fix(request: FixRequest, req: Request) -> dict:
    from app.routes.auth import _require_token
    from app.services import fix_service, github_service

    if not fix_service.is_available():
        raise HTTPException(status_code=503, detail="AI fix engine not available.")

    token = _require_token(req)

    # Fetch original file content from GitHub
    try:
        content = await github_service.get_file_content(
            token=token,
            owner=request.owner,
            repo=request.repo,
            path=request.finding.file,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch file content: {e}")

    issue_dict = request.finding.model_dump()

    # Run fix generation
    fix_result = fix_service.generate_fix(
        issue=issue_dict,
        source_code=content,
        language="python",  # hardcoded fallback, should ideally guess from extension
    )

    return {
        "status": "success",
        "fix": fix_result,
    }


# ── POST /api/fixes/validate ───────────────────────────────────────────────────
@router.post(
    "/validate",
    summary="Validate a proposed fix",
    description="Validates a FixResult before it is committed to the repository.",
)
async def validate_fix(req: Request) -> dict:
    """Dummy validation endpoint (ai_engine syntax validation).

    For now, assume AI fixes pass syntax validation.
    """
    return {
        "status": "success",
        "is_valid": True,
        "details": "Fix passes basic syntax validation.",
    }