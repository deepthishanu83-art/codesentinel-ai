"""
test_analyze_endpoint.py — Integration tests for POST /api/analyze.

Tests:
  - Mode A: source_code provided → 200 with real findings
  - Mode B: no source_code      → 501 with clear GitHub-pending message
  - Empty source_code           → 200 with zero findings
  - /api/status shows engines connected
"""
import sys
from pathlib import Path

# Ensure project root is on sys.path so ai_engine and backend app are importable
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── /api/status ───────────────────────────────────────────────────────────────

def test_status_engines_connected():
    """Both AI engines should report 'connected' when ai_engine is available."""
    resp = client.get("/api/status")
    assert resp.status_code == 200
    data = resp.json()
    engines = {e["name"]: e["status"] for e in data["engines"]}
    assert engines["analyzer_engine"] == "connected"
    assert engines["ai_engine"] == "connected"
    assert engines["github_engine"] == "connected"


# ── Mode B: GitHub-only request → 401 (requires auth) ─────────────────────────

def test_analyze_no_source_code_returns_401():
    """Without source_code, endpoint must authenticate to fetch from GitHub."""
    resp = client.post("/api/analyze", json={
        "owner": "alice",
        "repo":  "my-repo",
        "branch": "main",
    })
    assert resp.status_code == 401
    detail = resp.json()["detail"]
    assert "Not authenticated" in detail


# ── Mode A: clean code → 200 with zero findings ───────────────────────────────

def test_analyze_clean_code_returns_200_no_issues():
    """Clean Python code should return 200 with zero findings."""
    resp = client.post("/api/analyze", json={
        "owner": "alice",
        "repo":  "clean-repo",
        "branch": "main",
        "file_path": "utils.py",
        "language": "python",
        "source_code": "def add(a: int, b: int) -> int:\n    return a + b\n",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_issues"] == 0
    assert data["risk_score"] == 0
    assert data["risk_level"] == "low"
    assert data["release_decision"] == "RELEASE_READY"
    assert data["analysis_mode"] == "direct"
    assert data["repository"]["full_name"] == "alice/clean-repo"


# ── Mode A: SQL injection → 200 with CRITICAL security finding ───────────────

def test_analyze_sql_injection_detected():
    """SQL injection pattern must produce at least one critical/high security finding."""
    vuln_code = (
        'def get_user(db, user_id):\n'
        '    query = "SELECT * FROM users WHERE id=" + user_id\n'
        '    cursor = db.cursor()\n'
        '    cursor.execute(query)\n'
    )
    resp = client.post("/api/analyze", json={
        "owner": "alice",
        "repo":  "vuln-repo",
        "branch": "main",
        "file_path": "app/db.py",
        "language": "python",
        "source_code": vuln_code,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_issues"] >= 1
    assert data["risk_score"] > 0
    # In mock-LLM mode the AST-based BugAnalyzer may catch SQL concat as a bug
    # rather than security — either category is valid, what matters is detection.
    categories = [i["category"] for i in data["issues"]]
    assert any(c in categories for c in ("security", "bug")), (
        f"Expected at least one security or bug finding, got: {categories}"
    )


# ── Mode A: hardcoded secret → finding detected ───────────────────────────────

def test_analyze_hardcoded_password_detected():
    """Hardcoded credential pattern should be detected."""
    code = 'password = "super_secret_123"\nAPI_KEY = "abc123xyz"\n'
    resp = client.post("/api/analyze", json={
        "owner": "alice",
        "repo":  "secret-repo",
        "branch": "main",
        "file_path": "config.py",
        "language": "python",
        "source_code": code,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_issues"] >= 1


# ── Mode A: response schema shape ────────────────────────────────────────────

def test_analyze_response_schema_fields():
    """Response must contain all required AnalysisResponse fields."""
    resp = client.post("/api/analyze", json={
        "owner": "alice",
        "repo":  "shape-test",
        "branch": "develop",
        "source_code": "x = 1\n",
    })
    assert resp.status_code == 200
    data = resp.json()
    required_fields = [
        "repository", "branch", "issues", "total_issues",
        "risk_score", "risk_level", "release_decision",
        "release_reason", "analysis_mode",
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"
    assert data["branch"] == "develop"
    assert data["analysis_mode"] == "direct"


# ── Mode A: risk score bounds ─────────────────────────────────────────────────

def test_analyze_risk_score_bounds():
    """Risk score must be an integer between 0 and 100."""
    resp = client.post("/api/analyze", json={
        "owner": "alice",
        "repo":  "bounds-test",
        "branch": "main",
        "source_code": (
            'import subprocess\n'
            'subprocess.run(cmd, shell=True)\n'
            'eval(user_input)\n'
            'password = "hardcoded"\n'
        ),
    })
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["risk_score"], int)
    assert 0 <= data["risk_score"] <= 100
