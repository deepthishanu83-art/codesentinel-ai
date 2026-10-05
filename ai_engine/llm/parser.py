import json
import re
import logging
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger("CodeSentinel.LLMParser")


class LLMParseError(Exception):
    """Raised when JSON cannot be parsed from the LLM output."""
    pass


class LLMResponseValidationError(Exception):
    """Raised when required fields are missing or values are out of bounds."""
    pass


class LLMParser:
    """Robust parser and validator for LLM structured outputs."""

    @staticmethod
    def extract_raw_json(text: str) -> str:
        """
        Extract clean JSON string from raw LLM output, removing markdown fences
        and conversational prefixes/suffixes.
        """
        if not text:
            raise LLMParseError("Empty response received from LLM")

        cleaned = text.strip()

        # Handle ```json ... ``` or ``` ... ```
        if "```" in cleaned:
            # Match code fence block
            fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
            if fence_match:
                cleaned = fence_match.group(1).strip()

        # If it already starts with { or [, return
        if cleaned.startswith(("{", "[")):
            return cleaned

        # Otherwise search for the first { or [ to the last } or ]
        first_brace = cleaned.find("{")
        first_bracket = cleaned.find("[")

        start_idx = -1
        end_idx = -1

        if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
            start_idx = first_brace
            end_idx = cleaned.rfind("}")
        elif first_bracket != -1:
            start_idx = first_bracket
            end_idx = cleaned.rfind("]")

        if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
            return cleaned[start_idx : end_idx + 1].strip()

        return cleaned

    @classmethod
    def parse_json(cls, text: str) -> Union[Dict[str, Any], List[Any]]:
        """Extract and parse JSON from LLM output."""
        raw = cls.extract_raw_json(text)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            raise LLMParseError(f"Failed to decode JSON from LLM: {str(e)} | Content: {raw[:200]}") from e

    @classmethod
    def parse_dict(cls, text: str, required_fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """Parse text into a dictionary and validate required fields."""
        parsed = cls.parse_json(text)
        if not isinstance(parsed, dict):
            raise LLMResponseValidationError(f"Expected JSON object, got {type(parsed).__name__}")

        if required_fields:
            missing = [field for field in required_fields if field not in parsed]
            if missing:
                raise LLMResponseValidationError(f"Missing required fields in LLM response: {missing}")

        return parsed

    @classmethod
    def parse_list(cls, text: str, item_required_fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Parse text into a list of dictionaries and validate each element."""
        parsed = cls.parse_json(text)
        if not isinstance(parsed, list):
            # Sometimes models return a single dict instead of a list with 1 item
            if isinstance(parsed, dict):
                parsed = [parsed]
            else:
                raise LLMResponseValidationError(f"Expected JSON list, got {type(parsed).__name__}")

        if item_required_fields:
            for idx, item in enumerate(parsed):
                if not isinstance(item, dict):
                    raise LLMResponseValidationError(f"Item {idx} is not a JSON object")
                missing = [f for f in item_required_fields if f not in item]
                if missing:
                    raise LLMResponseValidationError(f"Item {idx} missing required fields: {missing}")

        return parsed

    @staticmethod
    def clean_fixed_code(code: str) -> str:
        """Strip accidental markdown fences from generated code snippet."""
        if not code:
            return ""
        cleaned = code.strip()
        fence_match = re.search(r"^```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```$", cleaned)
        if fence_match:
            return fence_match.group(1).strip()
        return cleaned

    @staticmethod
    def validate_confidence(val: Any) -> float:
        """Normalize confidence value to float between 0.0 and 1.0."""
        try:
            c = float(val)
            return max(0.0, min(1.0, c))
        except (ValueError, TypeError):
            return 0.5

    @staticmethod
    def validate_confidence_strict(val: Any) -> float:
        """Strictly validate confidence is a numeric value within [0.0, 1.0]."""
        try:
            c = float(val)
        except (ValueError, TypeError) as e:
            raise LLMResponseValidationError(f"Confidence must be a numeric float, got: {val}") from e
        if not (0.0 <= c <= 1.0):
            raise LLMResponseValidationError(f"Confidence {c} is out of valid bounds [0.0, 1.0]")
        return c

    @staticmethod
    def validate_severity(val: Any) -> str:
        """Validate and normalize severity level."""
        if not isinstance(val, str):
            raise LLMResponseValidationError(f"Severity must be a string, got {type(val).__name__}")
        sev = val.strip().upper()
        allowed = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        if sev not in allowed:
            raise LLMResponseValidationError(f"Unknown severity '{val}'. Must be one of {allowed}")
        return sev

    @classmethod
    def validate_fix_payload(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate all required fields of an AI fix payload strictly."""
        required = ["issue_id", "explanation", "fixed_code", "confidence", "auto_fix"]
        missing = [f for f in required if f not in data]
        if missing:
            raise LLMResponseValidationError(f"Missing required fields in fix payload: {missing}")

        fixed_code = cls.clean_fixed_code(str(data.get("fixed_code", "")))
        if not fixed_code.strip():
            raise LLMResponseValidationError("fixed_code cannot be empty")

        confidence = cls.validate_confidence_strict(data["confidence"])
        auto_fix = bool(data["auto_fix"])
        if confidence < 0.8:
            auto_fix = False

        return {
            "issue_id": str(data["issue_id"]),
            "explanation": str(data["explanation"]),
            "root_cause": str(data.get("root_cause", "")),
            "impact": str(data.get("impact", "")),
            "suggested_fix": str(data.get("suggested_fix", "")),
            "fixed_code": fixed_code,
            "confidence": confidence,
            "auto_fix": auto_fix
        }

