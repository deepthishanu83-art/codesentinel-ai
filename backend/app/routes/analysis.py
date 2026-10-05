"""analysis.py — Code analysis API.

Endpoints:
  GET  /api/status   — Live engine connection status.
  POST /api/analyze  — Run code analysis via ai_engine.

Business logic lives in services/analyzer_service.py (not here).
"""

from fastapi import APIRouter, HTTPException, Request

from app.config import APP_VERSION
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    ApiStatusResponse,
    Category,
    EngineStatus,
    EngineStatusInfo,
    IssueFinding,
    RepositoryInfo,
    RiskLevel,
    Severity,
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
    """Reports which backend engines are currently connected."""
    from app.services import ai_service, analyzer_service  # noqa: PLC0415

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
                status=EngineStatus.CONNECTED,
                message="GitHub REST API ready (Member 3 integrated).",
            ),
        ],
    )


# ── POST /api/analyze ──────────────────────────────────────────────────────────
@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Trigger code analysis on source code or a repository branch",
    description=(
        "**Mode A (available now):** Supply `source_code` in the request body. "
        "The ai_engine analyzers run immediately and return a full AnalysisResponse. \n\n"
        "**Mode B (requires Member 3):** Supply only `owner`/`repo`/`branch` without "
        "`source_code`. Returns HTTP 501 until the GitHub fetch layer is connected."
    ),
    responses={
        200: {"description": "Analysis completed successfully"},
        501: {"description": "GitHub repository fetch not yet implemented (Mode B — awaiting Member 3)"},
        503: {"description": "Analyzer engine not available"},
    },
)
async def analyze(request: AnalysisRequest, req: Request) -> AnalysisResponse:
    """Run code analysis using the integrated ai_engine.

    - If ``source_code`` is present → Mode A: runs immediately.
    - If ``source_code`` is absent  → Mode B: fetches repository files from GitHub.
    """
    from app.services import analyzer_service  # noqa: PLC0415

    # ── Guard: engine must be available ───────────────────────────────────────
    if not analyzer_service.is_available():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "analyzer_engine_unavailable",
                "message": (
                    "The ai_engine analyzers could not be imported. "
                    "Ensure the project root is on PYTHONPATH: "
                    "cd backend && PYTHONPATH=.. uvicorn app.main:app"
                ),
            },
        )

    # ── Mode B: fetch from GitHub ─────────────────────────────────────────────
    if not request.source_code:
        from app.routes.auth import _require_token
        from app.services import github_service

        token = _require_token(req)
        # 1. Fetch repo metadata
        repo_meta = await github_service.get_repository(token, request.owner, request.repo)
        repo_info = RepositoryInfo(
            id=repo_meta["id"],
            name=repo_meta["name"],
            full_name=repo_meta["full_name"],
            private=repo_meta["private"],
            default_branch=repo_meta["default_branch"],
            html_url=repo_meta["html_url"],
        )
        # 2. Fetch files
        try:
            files = await github_service.fetch_all_source_files(token, request.owner, request.repo, request.branch)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch repository files: {str(e)}")

        if not files:
            raise HTTPException(status_code=400, detail="No supported source files found in the repository.")

        # 3. Analyze all files
        raw_findings = []
        for file_data in files:
            findings = analyzer_service.run_analysis(
                file_path=file_data["path"],
                language=file_data["language"],
                source_code=file_data["content"],
            )
            raw_findings.extend(findings)
        analysis_mode = "github"
    else:
        # ── Mode A: run local analysis ────────────────────────────────────────────
        raw_findings = analyzer_service.run_analysis(
            file_path=request.file_path,
            language=request.language,
            source_code=request.source_code,
        )
        repo_info = RepositoryInfo(
            id=0,
            name=request.repo,
            full_name=f"{request.owner}/{request.repo}",
            private=False,
            default_branch=request.branch,
            html_url=f"https://github.com/{request.owner}/{request.repo}",
        )
        analysis_mode = "direct"

    # Map raw dicts to IssueFinding; skip entries that don't map cleanly
    issues: list[IssueFinding] = []
    for f in raw_findings:
        try:
            # Normalise severity / category to enum values
            sev_raw = str(f.get("severity", "low")).lower()
            # Map ai_engine internal severity names to schema enum values
            severity_map = {
                "critical": Severity.CRITICAL,
                "high": Severity.HIGH,
                "medium": Severity.MEDIUM,
                "low": Severity.LOW,
                "info": Severity.INFO,
            }
            severity = severity_map.get(sev_raw, Severity.LOW)

            cat_raw = str(f.get("category", f.get("type", "bug"))).lower()
            category_map = {
                "security": Category.SECURITY,
                "bug": Category.BUG,
                "code_smell": Category.CODE_SMELL,
                "code_quality": Category.CODE_SMELL,
                "performance": Category.PERFORMANCE,
                "style": Category.STYLE,
            }
            category = category_map.get(cat_raw, Category.BUG)

            issues.append(
                IssueFinding(
                    file=str(f.get("file", request.file_path)),
                    line=max(1, int(f.get("line", 1))),
                    severity=severity,
                    category=category,
                    title=str(f.get("title", "Issue detected")),
                    description=str(f.get("description", "")),
                    recommendation=str(f.get("recommendation", f.get("fix", ""))),
                )
            )
        except Exception:  # noqa: BLE001
            # Skip malformed findings rather than crashing the entire response
            continue

    # ── Compute risk score & release decision ─────────────────────────────────
    from ai_engine.risk_engine import ReleaseDecisionEngine, RiskCalculator  # noqa: PLC0415

    risk_metrics = RiskCalculator.calculate_risk(raw_findings)
    risk_score_100: int = risk_metrics.get("risk_score", 0)
    release_info = ReleaseDecisionEngine.evaluate_decision(risk_metrics=risk_metrics)

    # Map 0-100 risk score to risk_level enum
    if risk_score_100 >= 65:
        risk_level = RiskLevel.CRITICAL
    elif risk_score_100 >= 40:
        risk_level = RiskLevel.HIGH
    elif risk_score_100 >= 20:
        risk_level = RiskLevel.MEDIUM
    else:
        risk_level = RiskLevel.LOW

    # ── Build AnalysisResponse ─────────────────────────
    return AnalysisResponse(
        repository=repo_info,
        branch=request.branch,
        issues=issues,
        total_issues=len(issues),
        risk_score=risk_score_100,
        risk_level=risk_level,
        release_decision=release_info.get("decision"),
        release_reason=release_info.get("reason"),
        analysis_mode=analysis_mode,
    )