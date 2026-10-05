"""
fixes.py — AI fix generation API contract.

Endpoints (contract only — engine not yet connected):
  POST /api/fixes/generate   — Generate an AI fix for a single finding.
  POST /api/fixes/validate   — Validate a proposed fix before committing.

Business logic will live in services/fix_service.py (Member 2).
"""
from fastapi import APIRouter
from app.models.schemas import FixRequest

router = APIRouter(prefix="/api/fixes", tags=["Fixes"])


# ── POST /api/fixes/generate ───────────────────────────────────────────────────

@router.post(
    "/generate",
    summary="Generate an AI fix for an issue finding",
    description=(
        "Accepts a FixRequest (repository info + an IssueFinding). "
        "Returns HTTP 503 until the AI fix engine (Member 2) is connected. "
        "No fake fixes are generated."
    ),
    status_code=503,
)
async def generate_fix(request: FixRequest) -> dict:
    """
    CONTRACT ENDPOINT — schema validated, AI engine not yet wired.

    When Member 2 connects the fix engine, this handler will call
    fix_service.generate(request) and return a FixResult.
    """
    return {
        "status": "engine_not_connected",
        "message": (
            "The AI fix engine is not connected yet. "
            "This endpoint will return a FixResult once the "
            "Member 2 integration is complete."
        ),
        "received": {
            "owner":  request.owner,
            "repo":   request.repo,
            "branch": request.branch,
            "finding_title": request.finding.title,
        },
        "expected_response_schema": "FixResult",
    }


# ── POST /api/fixes/validate ───────────────────────────────────────────────────

@router.post(
    "/validate",
    summary="Validate a proposed fix",
    description=(
        "Validates a FixResult before it is committed to the repository. "
        "Returns HTTP 503 until the AI validation engine is connected."
    ),
    status_code=503,
)
async def validate_fix() -> dict:
    """
    CONTRACT ENDPOINT — not yet implemented.

    Will call fix_service.validate(fix_result) and return pass/fail + details.
    """
    return {
        "status": "engine_not_connected",
        "message": "The AI validation engine is not connected yet.",
        "expected_response_schema": "FixValidationResult",
    }
