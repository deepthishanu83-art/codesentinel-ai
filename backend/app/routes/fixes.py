"""fixes.py — AI fix generation API contract.

Endpoints:
  POST /api/fixes/generate — Generate an AI fix for a single finding.
  POST /api/fixes/validate — Validate a proposed fix before committing.

Business logic lives in services/fix_service.py (Member 2).
"""

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import FixRequest, ValidateFixRequest

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

    # Fetch original file content from GitHub or use local source_code
    if request.source_code:
        content = request.source_code
    elif request.owner == "local":
        raise HTTPException(status_code=400, detail="source_code is required for local fix generation.")
    else:
        # GitHub mode — token required to fetch file from GitHub
        token = _require_token(req)
        try:
            content = await github_service.get_file_content(
                token=token,
                owner=request.owner,
                repo=request.repo,
                path=request.finding.file,
                branch=request.branch,
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
async def validate_fix(request: ValidateFixRequest) -> dict:
    import ast

    code = (request.fixed_code or request.patch or "").strip()

    if not code:
        return {
            "status": "failed",
            "success": False,
            "valid": False,
            "is_valid": False,
            "errors": ["edited fixed code is required"],
            "validation_detail": "edited fixed code is required",
            "detail": "edited fixed code is required",
        }

    try:
        ast.parse(code)
        compile(code, "<string>", "exec")
        return {
            "status": "success",
            "success": True,
            "valid": True,
            "is_valid": True,
            "errors": [],
            "validation_detail": "Fix passes syntax validation.",
            "detail": "Fix passes syntax validation.",
        }
    except SyntaxError as e:
        err_msg = f"SyntaxError on line {e.lineno}: {e.msg}"
        return {
            "status": "failed",
            "success": False,
            "valid": False,
            "is_valid": False,
            "errors": [err_msg],
            "validation_detail": "The code contains syntax errors and cannot be compiled.",
            "detail": "The code contains syntax errors and cannot be compiled.",
        }
    except Exception as e:
        err_msg = f"Validation error: {str(e)}"
        return {
            "status": "failed",
            "success": False,
            "valid": False,
            "is_valid": False,
            "errors": [err_msg],
            "validation_detail": err_msg,
            "detail": err_msg,
        }