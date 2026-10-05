from typing import Dict, Any, List, Optional
from .risk_calculator import RiskCalculator


class ReleaseDecisionEngine:
    """
    Evaluates release readiness deterministically based on release risk score,
    critical security blockers, and issue counts.
    """

    @classmethod
    def evaluate_decision(
        cls,
        risk_metrics: Optional[Dict[str, Any]] = None,
        issues: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate release decision:
        - DO_NOT_RELEASE: Critical vulnerabilities or high risk (score >= 60)
        - RELEASE_WITH_WARNINGS: High issues or moderate risk (25 <= score < 60)
        - RELEASE_READY: Low risk (score < 25) and no critical/high blockers
        """
        if risk_metrics is None:
            risk_metrics = RiskCalculator.calculate_risk(issues or [])

        score = risk_metrics.get("risk_score", 0)
        critical_count = risk_metrics.get("critical_count", 0)
        high_count = risk_metrics.get("high_count", 0)
        medium_count = risk_metrics.get("medium_count", 0)
        low_count = risk_metrics.get("low_count", 0)

        # 1. Hard blocker: Any critical issue or score >= 60
        if critical_count > 0 or score >= 60:
            if critical_count > 0:
                reason = f"{critical_count} critical security vulnerabilities remain unresolved."
            else:
                reason = f"Aggregated release risk score ({score}/100) exceeds safety threshold (60)."
            
            return {
                "decision": "DO_NOT_RELEASE",
                "reason": reason,
                "risk_score": score,
                "blockers_count": critical_count + high_count,
                "recommendation": "Block deployment pipeline immediately. Remediate critical security vulnerabilities before promoting to production."
            }

        # 2. Warning gate: High issues or score >= 25
        if high_count > 0 or score >= 25:
            reason = f"{high_count} high-severity issues and {medium_count} medium-severity issues detected."
            return {
                "decision": "RELEASE_WITH_WARNINGS",
                "reason": reason,
                "risk_score": score,
                "blockers_count": high_count,
                "recommendation": "Proceed with caution. Release allowed with manager sign-off; high-severity findings should be scheduled for rapid remediation."
            }

        # 3. Clean release
        return {
            "decision": "RELEASE_READY",
            "reason": f"Codebase satisfies release safety gates with low overall risk score ({score}/100).",
            "risk_score": score,
            "blockers_count": 0,
            "recommendation": "Release approved. No critical or high-severity vulnerabilities detected."
        }
