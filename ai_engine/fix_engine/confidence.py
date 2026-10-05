import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("CodeSentinel.ConfidenceEngine")


class ConfidenceEngine:
    """
    Calculates deterministic fix confidence and evaluates whether an automated
    fix is safe to apply without manual human review.
    """

    # Categories requiring mandatory human review
    HUMAN_REVIEW_CATEGORIES = {
        "concurrency",
        "deadlock",
        "race condition",
        "architecture",
        "database migration",
        "schema change",
        "business logic",
        "complex refactor",
        "cryptographic key exchange"
    }

    # High confidence categories safe for automated fixing
    HIGH_CONFIDENCE_CATEGORIES = {
        "sql injection",
        "hardcoded secret",
        "hardcoded password",
        "eval/exec",
        "remote code execution via eval/exec",
        "unsafe subprocess",
        "command injection via shell=true",
        "unused import",
        "mutable default argument",
        "bare except clause",
        "weak cryptographic hash",
        "division by zero"
    }

    @classmethod
    def evaluate(
        cls,
        category: str,
        detection_confidence: float = 0.90,
        ai_confidence: float = 0.90,
        patch_size: int = 1,
        severity: str = "HIGH",
        validation_status: Optional[Dict[str, Any]] = None,
        has_valid_patch: bool = True,
        has_valid_fix: bool = True
    ) -> Dict[str, Any]:
        """
        Evaluate fix confidence and auto-fix eligibility with strict safety gates.
        
        Args:
            category: Vulnerability / bug category.
            detection_confidence: Confidence of initial detection (0.0 to 1.0).
            ai_confidence: Confidence reported by LLM/fix generator (0.0 to 1.0).
            patch_size: Number of modified lines.
            severity: Issue severity (CRITICAL, HIGH, MEDIUM, LOW).
            validation_status: Dict containing validation results.
            has_valid_patch: False if diff generation failed or was empty.
            has_valid_fix: False if fixed_code is missing or empty.
        
        Returns:
            Dict containing confidence, auto_fix_allowed, and explainable reason.
        """
        # Hard safety gate 1: Missing or empty fix
        if not has_valid_fix:
            return {
                "confidence": 0.0,
                "auto_fix_allowed": False,
                "reason": "Fix rejected because replacement code is missing or empty."
            }

        # Hard safety gate 2: Missing or empty patch
        if not has_valid_patch:
            return {
                "confidence": 0.0,
                "auto_fix_allowed": False,
                "reason": "Fix rejected because patch generation failed or produced an empty diff."
            }

        cat_lower = category.lower()

        # Step 1: Base confidence weighted from detection and AI confidence
        base_confidence = (detection_confidence * 0.4) + (ai_confidence * 0.6)

        # Step 2: Penalize large patch size (blast radius)
        if patch_size > 15:
            base_confidence -= 0.15
        elif patch_size > 5:
            base_confidence -= 0.05

        # Step 3: Mandatory human review check
        for pattern in cls.HUMAN_REVIEW_CATEGORIES:
            if pattern in cat_lower:
                return {
                    "confidence": round(min(base_confidence, 0.70), 2),
                    "auto_fix_allowed": False,
                    "reason": f"Category '{category}' involves complex architecture, concurrency, or business logic requiring human review."
                }

        # Step 4: Evaluate validation status if provided
        if validation_status:
            syntax_passed = validation_status.get("syntax_passed")
            security_passed = validation_status.get("security_scan_passed")
            tests_passed = validation_status.get("tests_passed")

            # Hard failure if syntax compilation failed
            if syntax_passed is False:
                return {
                    "confidence": 0.0,
                    "auto_fix_allowed": False,
                    "reason": "Fix failed syntax validation (compiler error detected)."
                }

            # Hard failure if security re-scan failed
            if security_passed is False:
                return {
                    "confidence": 0.2,
                    "auto_fix_allowed": False,
                    "reason": "Fix failed security re-scan (vulnerability still persists or new issues introduced)."
                }

            # Hard failure if test suite execution failed
            if tests_passed is False:
                return {
                    "confidence": 0.3,
                    "auto_fix_allowed": False,
                    "reason": "Fix failed regression test suite (existing unit tests failed)."
                }

            # Boost confidence if all active validations passed
            if syntax_passed is True and security_passed is True:
                base_confidence = min(1.0, base_confidence + 0.10)
                if tests_passed is True:
                    base_confidence = min(1.0, base_confidence + 0.05)

        # Step 5: Check category compatibility
        is_known_high_confidence = any(k in cat_lower for k in cls.HIGH_CONFIDENCE_CATEGORIES)
        final_confidence = round(max(0.0, min(1.0, base_confidence)), 2)

        if final_confidence >= 0.85 and is_known_high_confidence:
            return {
                "confidence": final_confidence,
                "auto_fix_allowed": True,
                "reason": f"High confidence ({final_confidence}) well-defined remediation pattern for '{category}'."
            }

        if final_confidence < 0.80:
            return {
                "confidence": final_confidence,
                "auto_fix_allowed": False,
                "reason": f"Confidence score ({final_confidence}) is below automated release threshold (0.80)."
            }

        return {
            "confidence": final_confidence,
            "auto_fix_allowed": True,
            "reason": f"Validated fix with acceptable confidence ({final_confidence})."
        }
