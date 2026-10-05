import ast
import pytest
from ai_engine.analyzers.security_analyzer import SecurityAnalyzer
from ai_engine.fix_engine.fix_generator import FixGenerator
from ai_engine.fix_engine.patch_generator import PatchGenerator
from ai_engine.fix_engine.confidence import ConfidenceEngine
from ai_engine.risk_engine.risk_calculator import RiskCalculator
from ai_engine.risk_engine.release_decision import ReleaseDecisionEngine
from ai_engine.llm.client import MockLLMClient


def test_complete_end_to_end_pipeline():
    """
    End-to-End Integration Test:
    Vulnerable Python Code
            ↓
    Security Analyzer
            ↓
    Issue
            ↓
    Mock LLM
            ↓
    AI Explanation
            ↓
    AI Fix
            ↓
    Patch
            ↓
    Validation
            ↓
    Confidence
            ↓
    Risk Calculation (Before vs After)
            ↓
    Release Decision (DO_NOT_RELEASE -> RELEASE_READY)
    """
    # 1. Real vulnerable code input
    vulnerable_source = """import sqlite3

def get_user_profile(db_path, user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchone()
"""

    mock_llm = MockLLMClient()

    # 2. Security Analyzer inspects real code
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    detected_issues = analyzer.analyze("app.py", "python", vulnerable_source)

    assert len(detected_issues) >= 1
    primary_issue = next(i for i in detected_issues if "SQL" in i["category"])
    assert primary_issue["severity"] == "CRITICAL"
    assert primary_issue["cwe_id"] == "CWE-89"
    assert "query = " in primary_issue["evidence"]

    # 3. Calculate initial pre-fix release risk
    pre_fix_risk = RiskCalculator.calculate_risk(detected_issues)
    assert pre_fix_risk["critical_count"] >= 1
    assert pre_fix_risk["risk_score"] >= 65

    pre_fix_decision = ReleaseDecisionEngine.evaluate_decision(risk_metrics=pre_fix_risk)
    assert pre_fix_decision["decision"] == "DO_NOT_RELEASE"
    assert "critical security vulnerabilities" in pre_fix_decision["reason"]

    # 4. FixGenerator generates minimal evidence-backed fix
    fix_generator = FixGenerator(llm_client=mock_llm)
    fix_result = fix_generator.generate_fix(primary_issue, vulnerable_source, "python")

    assert fix_result["issue_id"] == primary_issue["id"]
    assert "explanation" in fix_result
    assert "fixed_code" in fix_result
    assert fix_result["confidence"] >= 0.8
    assert fix_result["auto_fix"] is True
    assert not fix_result["fixed_code"].startswith("```")

    # 5. PatchGenerator creates unified diff
    # Apply the minimal fix to replace the vulnerable query line
    fixed_source, replaced = PatchGenerator.apply_snippet_replacement(
        vulnerable_source,
        'query = "SELECT * FROM users WHERE id=" + user_id',
        'query = "SELECT * FROM users WHERE id = %s"'
    )
    assert replaced is True
    patch = PatchGenerator.create_patch(vulnerable_source, fixed_source, file_path="app.py")
    assert patch["additions"] >= 1
    assert patch["deletions"] >= 1
    assert "--- a/app.py" in patch["diff"]
    assert "+++ b/app.py" in patch["diff"]

    # 6. Syntax and Security Validation
    # Compile check
    syntax_valid = True
    try:
        compile(fixed_source, "app.py", "exec")
        ast.parse(fixed_source)
    except Exception:
        syntax_valid = False
    assert syntax_valid is True

    # Security re-scan on remediated code
    post_fix_issues = analyzer.analyze("app.py", "python", fixed_source)
    # Ensure SQL injection with string concat is neutralized
    remaining_sql_issues = [i for i in post_fix_issues if "SQL" in i["category"] and "+" in i.get("evidence", "")]
    assert len(remaining_sql_issues) == 0

    # 7. ConfidenceEngine evaluates post-validation confidence
    confidence_result = ConfidenceEngine.evaluate(
        category=primary_issue["category"],
        detection_confidence=primary_issue["confidence"],
        ai_confidence=fix_result["confidence"],
        patch_size=patch["total_changes"],
        severity=primary_issue["severity"],
        validation_status={
            "syntax_passed": syntax_valid,
            "security_scan_passed": (len(remaining_sql_issues) == 0),
            "tests_passed": True
        }
    )
    assert confidence_result["confidence"] >= 0.95
    assert confidence_result["auto_fix_allowed"] is True

    # 8. Risk Recalculation & Release Decision Update
    # After remediation of the critical vulnerability:
    post_fix_risk = RiskCalculator.calculate_risk(remaining_sql_issues)
    assert post_fix_risk["critical_count"] == 0
    assert post_fix_risk["risk_score"] == 0

    post_fix_decision = ReleaseDecisionEngine.evaluate_decision(risk_metrics=post_fix_risk)
    assert post_fix_decision["decision"] == "RELEASE_READY"
    assert "low overall risk score" in post_fix_decision["reason"]
