"""
ai_service.py — LLM client integration.

Wraps Member 2's ai_engine.llm so route handlers stay thin.
Uses AI_PROVIDER / AI_MODEL / AI_API_KEY from config.
"""
from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[4]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from ai_engine.llm import get_llm_client  # type: ignore
    _ENGINE_AVAILABLE = True
except ImportError:
    _ENGINE_AVAILABLE = False


def is_available() -> bool:
    return _ENGINE_AVAILABLE


def get_client():
    """
    Return a ready-to-use LLM client configured from environment variables.

    AI_PROVIDER defaults to 'mock' so the engine works without a real key.
    Raises RuntimeError when ai_engine is not importable.
    """
    if not _ENGINE_AVAILABLE:
        raise RuntimeError(
            "ai_engine.llm is not available. "
            "Check that the ai_engine package is on PYTHONPATH."
        )

    from app.config import AI_PROVIDER, AI_MODEL, AI_API_KEY  # noqa: PLC0415
    return get_llm_client(
        provider=AI_PROVIDER or "mock",
        model=AI_MODEL,
        api_key=AI_API_KEY or None,
    )
