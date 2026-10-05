import math
from typing import List, Dict, Any


class RiskCalculator:
    """
    Calculates a transparent, deterministic release risk score (0-100)
    from code findings based on severity, confidence, type, and issue volume.
    
    FORMULA SPECIFICATION:
    ----------------------
    1. Base Severity Weights:
       - CRITICAL = 10.0
       - HIGH     = 7.0
       - MEDIUM   = 4.0
       - LOW      = 1.0
       
    2. Type Multipliers:
       - Security Vulnerability: 1.5x (exploitable risk, data breach)
       - Functional Bug:         1.2x (runtime disruption, exceptions)
       - Code Smell:             0.8x (maintainability debt)
       
    3. Issue Risk Contribution:
       issue_risk = BaseWeight(severity) * confidence * TypeMultiplier(type)
       
    4. Raw Cumulative Score:
       raw_score = Sum(issue_risk for each detected issue)
       
    5. Normalization (0 - 100):
       - If no issues: risk_score = 0
       - Capped linear scaling:
         risk_score = min(100, round(raw_score * 2.8))
       - Critical override safeguard:
         If any CRITICAL issue is present, minimum risk_score = 65
    """

    SEVERITY_WEIGHTS = {
        "CRITICAL": 10.0,
        "HIGH": 7.0,
        "MEDIUM": 4.0,
        "LOW": 1.0,
    }

    TYPE_MULTIPLIERS = {
        "security": 1.5,
        "bug": 1.2,
        "code_smell": 0.8,
    }

    @classmethod
    def calculate_risk(cls, issues: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate transparent release risk score and categorized issue counts.
        """
        if not issues:
            return {
                "risk_score": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "security_count": 0,
                "bug_count": 0,
                "code_smell_count": 0,
                "total_issues": 0,
                "raw_score": 0.0,
                "formula": "raw_score = sum(severity_weight * confidence * type_multiplier); score = min(100, round(raw_score * 2.8))"
            }

        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0

        security_count = 0
        bug_count = 0
        code_smell_count = 0

        raw_score = 0.0

        for issue in issues:
            severity = str(issue.get("severity", "LOW")).upper()
            issue_type = str(issue.get("type", "security")).lower()
            confidence = float(issue.get("confidence", 0.90))
            confidence = max(0.1, min(1.0, confidence))

            # Count by severity
            if severity == "CRITICAL":
                critical_count += 1
            elif severity == "HIGH":
                high_count += 1
            elif severity == "MEDIUM":
                medium_count += 1
            else:
                low_count += 1

            # Count by type
            if issue_type == "security":
                security_count += 1
            elif issue_type == "bug":
                bug_count += 1
            else:
                code_smell_count += 1

            weight = cls.SEVERITY_WEIGHTS.get(severity, 1.0)
            multiplier = cls.TYPE_MULTIPLIERS.get(issue_type, 1.0)

            raw_score += (weight * confidence * multiplier)

        # Normalize to 0-100
        score = min(100, int(round(raw_score * 2.8)))

        # Critical severity safeguard: If there is at least one critical vulnerability, release risk is >= 65
        if critical_count > 0:
            score = max(65, score)

        return {
            "risk_score": score,
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "security_count": security_count,
            "bug_count": bug_count,
            "code_smell_count": code_smell_count,
            "total_issues": len(issues),
            "raw_score": round(raw_score, 2),
            "formula": "raw_score = sum(severity_weight * confidence * type_multiplier); score = min(100, round(raw_score * 2.8)); critical_safeguard = max(65, score) if critical_count > 0"
        }
