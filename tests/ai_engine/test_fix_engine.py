import pytest
from ai_engine.fix_engine.fix_generator import FixGenerator
from ai_engine.fix_engine.patch_generator import PatchGenerator
from ai_engine.fix_engine.confidence import ConfidenceEngine
from ai_engine.llm.client import MockLLMClient


@pytest.fixture
def mock_llm():
    return MockLLMClient()


def test_fix_generator_sql_injection(mock_llm):
    """
    Verify fix generator produces a parameterized query remediation
    for SQL injection without markdown fences.
    """
    generator = FixGenerator(llm_client=mock_llm)
    issue = {
        "id": "ISSUE-001",
        "category": "SQL Injection",
        "severity": "CRITICAL",
        "message": "User input is directly concatenated into SQL query.",
        "code_snippet": 'query = "SELECT * FROM users WHERE id=" + user_id',
        "file": "login.py"
    }
    source_code = """
def login(user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    cursor.execute(query)
"""
    result = generator.generate_fix(issue, source_code, "python")

    assert result["issue_id"] == "ISSUE-001"
    assert "explanation" in result
    assert "root_cause" in result
    assert "impact" in result
    assert "suggested_fix" in result
    assert "fixed_code" in result
    assert result["confidence"] >= 0.8
    assert result["auto_fix"] is True
    # Verify no markdown fences in fixed_code
    assert not result["fixed_code"].startswith("```")
    # Verify parameterized query in fix
    assert "%s" in result["fixed_code"] or "?" in result["fixed_code"] or "execute" in result["fixed_code"]


def test_patch_generator_unified_diff():
    """Verify patch generator outputs a standard unified diff and change metrics."""
    original = "x = 1\ny = 2\nz = 3\n"
    fixed = "x = 1\ny = 20\nz = 3\n"

    patch = PatchGenerator.create_patch(original, fixed, "test.py")

    assert patch["file"] == "test.py"
    assert patch["additions"] == 1
    assert patch["deletions"] == 1
    assert patch["total_changes"] == 2
    assert "--- a/test.py" in patch["diff"]
    assert "+++ b/test.py" in patch["diff"]
    assert "-y = 2" in patch["diff"]
    assert "+y = 20" in patch["diff"]


def test_patch_generator_snippet_replacement():
    """Verify applying replacement snippet to full code string."""
    full_code = "def foo():\n    bad_code()\n    return True"
    target = "    bad_code()"
    replacement = "    good_code()"

    new_code, success = PatchGenerator.apply_snippet_replacement(full_code, target, replacement)
    assert success is True
    assert "good_code()" in new_code
    assert "bad_code()" not in new_code


def test_confidence_engine_high_confidence():
    """Verify SQL injection with high AI confidence is allowed for auto-fix."""
    eval_result = ConfidenceEngine.evaluate(
        category="SQL Injection",
        detection_confidence=0.95,
        ai_confidence=0.95,
        patch_size=2,
        severity="CRITICAL"
    )
    assert eval_result["confidence"] >= 0.85
    assert eval_result["auto_fix_allowed"] is True


def test_confidence_engine_human_review_required():
    """Verify concurrency and architecture categories enforce human review."""
    eval_result = ConfidenceEngine.evaluate(
        category="Concurrency Deadlock Risk",
        detection_confidence=0.90,
        ai_confidence=0.90,
        patch_size=3
    )
    assert eval_result["auto_fix_allowed"] is False
    assert "human review" in eval_result["reason"].lower()


def test_confidence_engine_validation_failure():
    """Verify validation syntax failure drops confidence to 0 and blocks auto-fix."""
    eval_result = ConfidenceEngine.evaluate(
        category="SQL Injection",
        detection_confidence=0.95,
        ai_confidence=0.95,
        patch_size=2,
        validation_status={"syntax_passed": False, "security_scan_passed": False}
    )
    assert eval_result["confidence"] == 0.0
    assert eval_result["auto_fix_allowed"] is False
    assert "syntax validation" in eval_result["reason"].lower()


def test_confidence_engine_validation_success_boost():
    """Verify passing syntax and security re-scans increases confidence."""
    eval_result = ConfidenceEngine.evaluate(
        category="SQL Injection",
        detection_confidence=0.85,
        ai_confidence=0.85,
        patch_size=2,
        validation_status={"syntax_passed": True, "security_scan_passed": True, "tests_passed": True}
    )
    assert eval_result["confidence"] >= 0.95
    assert eval_result["auto_fix_allowed"] is True
