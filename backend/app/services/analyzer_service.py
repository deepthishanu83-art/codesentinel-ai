"""
analyzer_service.py — Static analysis orchestration.

Wraps Member 2's ai_engine analyzers so route handlers stay thin.
Falls back gracefully when ai_engine is not importable (e.g. missing deps).
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure the project root is on sys.path so `ai_engine` is importable
# whether the backend is started from backend/ or from the project root.
_PROJECT_ROOT = Path(__file__).resolve().parents[4]  # codesentinel-ai/
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from ai_engine.analyzers import BugAnalyzer, SecurityAnalyzer, CodeQualityAnalyzer
    _ENGINE_AVAILABLE = True
except ImportError:
    _ENGINE_AVAILABLE = False


def is_available() -> bool:
    """Return True when the ai_engine analyzers are importable."""
    return _ENGINE_AVAILABLE


def run_analysis(file_path: str, language: str, source_code: str) -> list[dict]:
    """
    Run all three analyzers against a single source file.

    Parameters
    ----------
    file_path   : relative path used as an identifier in findings
    language    : programming language string (e.g. "python")
    source_code : raw source text

    Returns
    -------
    List of finding dicts (compatible with IssueFinding schema).
    Raises RuntimeError when the engine is not available.
    """
    if not _ENGINE_AVAILABLE:
        raise RuntimeError(
            "ai_engine is not available. "
            "Ensure the ai_engine package is on PYTHONPATH and its "
            "dependencies are installed."
        )

    findings: list[dict] = []
    for Analyzer in (SecurityAnalyzer, BugAnalyzer, CodeQualityAnalyzer):
        try:
            results = Analyzer().analyze(file_path, language, source_code)
            if isinstance(results, list):
                findings.extend(results)
        except Exception as exc:  # noqa: BLE001
            # Log but don't crash the entire analysis if one analyzer fails
            findings.append({
                "file": file_path,
                "line": 0,
                "severity": "LOW",
                "category": "analyzer_error",
                "title": f"{Analyzer.__name__} error",
                "description": str(exc),
                "recommendation": "Check analyzer_service logs.",
                "confidence": 0.0,
            })
    return findings
