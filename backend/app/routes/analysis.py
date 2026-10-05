"""
analysis.py — Code analysis API contract.

Endpoints:
  GET  /api/status   — Returns the connection state of every engine.
  POST /api/analyze  — Validates the AnalysisRequest; defers to the
                       analyzer engine (Member 2) when connected.

Business logic lives in services/analyzer_service.py (not here).
"""
from fastapi import APIRouter
from app.config import APP_VERSION
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    ApiStatusResponse,
    EngineStatus,
    EngineStatusInfo,
)

router = APIRouter(prefix="/api", tags=["Analysis"])


# ── GET /api/status ────────────────────────────────────────────────────────────

@router.get(
    "/status",
    response_model=ApiStatusResponse,
    summary="API and engine connection status",
    description=(
        "Returns the running API version and the connection state of "
        "each integrated engine (analyzer, AI, GitHub)."
    ),
)
async def api_status() -> ApiStatusResponse:
    """
    Reports which backend engines are currently connected.
    """
    from app.services import analyzer_service, ai_service, fix_service  # noqa: PLC0415

    analyzer_ok = analyzer_service.is_available()
    ai_ok = ai_service.is_available()

    return ApiStatusResponse(
        api="CodeSentinel AI",
        version=APP_VERSION,
        engines=[
            EngineStatusInfo(
                name="analyzer_engine",
                status=EngineStatus.CONNECTED if analyzer_ok else EngineStatus.DISCONNECTED,
                message="ai_engine.analyzers ready." if analyzer_ok else "ai_engine not importable — check PYTHONPATH.",
            ),
            EngineStatusInfo(
                name="ai_engine",
                status=EngineStatus.CONNECTED if ai_ok else EngineStatus.DISCONNECTED,
                message="ai_engine.llm ready." if ai_ok else "ai_engine not importable — check PYTHONPATH.",
            ),
            EngineStatusInfo(
                name="github_engine",
                status=EngineStatus.DISCONNECTED,
                message="Waiting for Member 3 — GitHub Repository Engine integration.",
            ),
        ],
    )


# ── POST /api/analyze ──────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    summary="Trigger code analysis on a repository branch",
    description=(
        "Accepts and validates an AnalysisRequest. "
        "Returns HTTP 503 until the analyzer engine (Member 2) is connected. "
        "No fake analysis is performed."
    ),
    responses={
        503: {"description": "Analyzer engine not yet connected"},
    },
    status_code=503,
)
async def analyze(request: AnalysisRequest) -> dict:
    """
    CONTRACT ENDPOINT — schema validated, engine not yet wired.

    The request body is fully validated against AnalysisRequest.
    When Member 2 connects the analyzer engine, this handler will call
    analyzer_service.run_analysis(request) and return an AnalysisResponse.

    Intentionally returns 503 so callers know the engine is unavailable,
    not that the request was malformed.
    """
    return {
        "status": "engine_not_connected",
        "message": (
            "The analysis engine is not connected yet. "
            "This endpoint will return a full AnalysisResponse once "
            "the Member 2 integration is complete."
        ),
        "received": {
            "owner":  request.owner,
            "repo":   request.repo,
            "branch": request.branch,
        },
        "expected_response_schema": "AnalysisResponse",
    }
