"""
fix_service.py — Fix generation and validation orchestration.

Wraps Member 2's ai_engine.fix_engine and ai_engine.risk_engine
so route handlers stay thin.
"""
from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[4]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from ai_engine.fix_engine import FixGenerator, PatchGenerator, ConfidenceEngine  # type: ignore
    from ai_engine.risk_engine import RiskCalculator, ReleaseDecisionEngine  # type: ignore
    _ENGINE_AVAILABLE = True
except ImportError:
    _ENGINE_AVAILABLE = False


def is_available() -> bool:
    return _ENGINE_AVAILABLE


def generate_fix(issue: dict, source_code: str, language: str = "python") -> dict:
    """
    Generate an AI fix for a single issue finding.

    Parameters
    ----------
    issue       : finding dict produced by analyzer_service.run_analysis()
    source_code : raw source text of the affected file
    language    : programming language string

    Returns
    -------
    fix dict compatible with FixResult schema.
    Raises RuntimeError when the engine is not available.
    """
    if not _ENGINE_AVAILABLE:
        raise RuntimeError("ai_engine.fix_engine is not available.")

    generator = FixGenerator()
    fix = generator.generate_fix(issue, source_code, language=language)
    return fix


def create_patch(original: str, modified: str, file_path: str) -> dict:
    """Generate a unified-diff patch between original and modified source."""
    if not _ENGINE_AVAILABLE:
        raise RuntimeError("ai_engine.fix_engine is not available.")
    return PatchGenerator.create_patch(original, modified, file_path=file_path)


def evaluate_confidence(
    category: str,
    detection_confidence: float,
    ai_confidence: float,
    patch_size: int,
    severity: str,
    validation_status: dict,
) -> dict:
    """Evaluate fix confidence and auto-fix safety."""
    if not _ENGINE_AVAILABLE:
        raise RuntimeError("ai_engine.fix_engine is not available.")
    return ConfidenceEngine.evaluate(
        category=category,
        detection_confidence=detection_confidence,
        ai_confidence=ai_confidence,
        patch_size=patch_size,
        severity=severity,
        validation_status=validation_status,
    )


def calculate_release_risk(issues: list[dict]) -> dict:
    """Compute a 0-100 release risk score from a list of findings."""
    if not _ENGINE_AVAILABLE:
        raise RuntimeError("ai_engine.risk_engine is not available.")
    risk_metrics = RiskCalculator.calculate_risk(issues)
    decision = ReleaseDecisionEngine.evaluate_decision(risk_metrics=risk_metrics)
    return {**risk_metrics, **decision}
