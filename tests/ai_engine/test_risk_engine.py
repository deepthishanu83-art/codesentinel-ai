import pytest
from ai_engine.risk_engine.risk_calculator import RiskCalculator
from ai_engine.risk_engine.release_decision import ReleaseDecisionEngine


def test_risk_calculator_empty_issues():
    """Verify empty issue list produces 0 risk score."""
    result = RiskCalculator.calculate_risk([])
    assert result["risk_score"] == 0
    assert result["critical_count"] == 0
    assert result["total_issues"] == 0


def test_risk_calculator_deterministic_weights():
    """Verify calculation strictly adheres to documented severity and type weights."""
    issues = [
        {"severity": "CRITICAL", "type": "security", "confidence": 1.0},
        {"severity": "HIGH", "type": "bug", "confidence": 1.0},
        {"severity": "LOW", "type": "code_smell", "confidence": 1.0},
    ]
    # Expected raw:
    # 1. Critical security: 10 * 1.0 * 1.5 = 15.0
    # 2. High bug: 7 * 1.0 * 1.2 = 8.4
    # 3. Low code smell: 1 * 1.0 * 0.8 = 0.8
    # Raw total = 24.2
    # Score = min(100, round(24.2 * 2.8)) = 68
    # Safeguard: critical_count > 0 => max(65, 68) = 68
    result = RiskCalculator.calculate_risk(issues)

    assert result["critical_count"] == 1
    assert result["high_count"] == 1
    assert result["low_count"] == 1
    assert result["security_count"] == 1
    assert result["bug_count"] == 1
    assert result["code_smell_count"] == 1
    assert result["raw_score"] == 24.2
    assert result["risk_score"] == 68


def test_risk_calculator_critical_safeguard():
    """Verify any critical issue enforces a minimum release risk score of 65."""
    single_critical = [{"severity": "CRITICAL", "type": "security", "confidence": 0.5}]
    result = RiskCalculator.calculate_risk(single_critical)
    assert result["critical_count"] == 1
    assert result["risk_score"] >= 65


def test_release_decision_do_not_release():
    """Verify critical issue triggers DO_NOT_RELEASE."""
    issues = [{"severity": "CRITICAL", "type": "security", "confidence": 0.95}]
    decision = ReleaseDecisionEngine.evaluate_decision(issues=issues)

    assert decision["decision"] == "DO_NOT_RELEASE"
    assert "critical security vulnerabilities" in decision["reason"]
    assert decision["risk_score"] >= 65


def test_release_decision_release_with_warnings():
    """Verify high/medium warnings trigger RELEASE_WITH_WARNINGS."""
    issues = [
        {"severity": "HIGH", "type": "code_smell", "confidence": 0.8},
        {"severity": "MEDIUM", "type": "bug", "confidence": 0.8}
    ]
    decision = ReleaseDecisionEngine.evaluate_decision(issues=issues)

    assert decision["decision"] == "RELEASE_WITH_WARNINGS"
    assert "issues detected" in decision["reason"]


def test_release_decision_release_ready():
    """Verify low issues with low score produce RELEASE_READY."""
    issues = [{"severity": "LOW", "type": "code_smell", "confidence": 0.5}]
    decision = ReleaseDecisionEngine.evaluate_decision(issues=issues)

    assert decision["decision"] == "RELEASE_READY"
    assert "low overall risk score" in decision["reason"]
    assert decision["risk_score"] < 25
