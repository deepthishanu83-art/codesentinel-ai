import pytest
import json
from ai_engine.llm.client import MockLLMClient, get_llm_client, LLMClient
from ai_engine.llm.parser import (
    LLMParser,
    LLMParseError,
    LLMResponseValidationError
)


def test_mock_llm_client():
    """Verify MockLLMClient provides deterministic test responses."""
    client = MockLLMClient()
    response = client.generate("Analyze SQL Injection in SELECT * FROM users")
    assert "Deterministic mock analysis completed." in response

    # Test custom response configuration
    client.set_response("CUSTOM_QUERY", json.dumps({"custom": "result"}))
    custom_resp = client.generate("This contains CUSTOM_QUERY inside")
    assert json.loads(custom_resp) == {"custom": "result"}


def test_get_llm_client_fallback():
    """Verify get_llm_client defaults safely to MockLLMClient when no key is set."""
    client = get_llm_client(provider="mock")
    assert isinstance(client, MockLLMClient)


def test_llm_parser_clean_json():
    """Verify parsing clean JSON string."""
    raw = '{"key": "value", "count": 42}'
    data = LLMParser.parse_dict(raw, required_fields=["key", "count"])
    assert data["key"] == "value"
    assert data["count"] == 42


def test_llm_parser_markdown_wrapped_json():
    """Verify parsing JSON wrapped in markdown code fences."""
    raw = """Here is the result:
```json
{
  "issue_id": "ISSUE-001",
  "explanation": "Fix explanation",
  "fixed_code": "x = 10"
}
```
Hope this helps!"""
    data = LLMParser.parse_dict(raw, required_fields=["issue_id", "fixed_code"])
    assert data["issue_id"] == "ISSUE-001"
    assert data["fixed_code"] == "x = 10"


def test_llm_parser_missing_required_fields():
    """Verify LLMResponseValidationError when required fields are missing."""
    raw = '{"issue_id": "ISSUE-001"}'
    with pytest.raises(LLMResponseValidationError) as exc_info:
        LLMParser.parse_dict(raw, required_fields=["issue_id", "fixed_code", "explanation"])
    assert "fixed_code" in str(exc_info.value)


def test_llm_parser_malformed_json():
    """Verify LLMParseError when JSON syntax is invalid."""
    raw = '{"key": "unclosed string'
    with pytest.raises(LLMParseError):
        LLMParser.parse_json(raw)


def test_llm_parser_list():
    """Verify parsing list of JSON objects."""
    raw = '[{"category": "SQLi", "severity": "HIGH"}, {"category": "XSS", "severity": "MEDIUM"}]'
    items = LLMParser.parse_list(raw, item_required_fields=["category", "severity"])
    assert len(items) == 2
    assert items[0]["category"] == "SQLi"
    assert items[1]["severity"] == "MEDIUM"


def test_clean_fixed_code_fences():
    """Verify cleaning markdown code fences from fixed_code strings."""
    fenced = "```python\ncursor.execute(q, (id,))\n```"
    cleaned = LLMParser.clean_fixed_code(fenced)
    assert cleaned == "cursor.execute(q, (id,))"


def test_validate_confidence():
    """Verify confidence value normalization."""
    assert LLMParser.validate_confidence("0.85") == 0.85
    assert LLMParser.validate_confidence(1.5) == 1.0
    assert LLMParser.validate_confidence(-0.5) == 0.0
    assert LLMParser.validate_confidence("invalid") == 0.5


def test_llm_parser_empty_response():
    """Case 5: Verify parser rejects empty LLM response."""
    with pytest.raises(LLMParseError) as exc_info:
        LLMParser.extract_raw_json("")
    assert "Empty response" in str(exc_info.value)


def test_llm_parser_wrong_data_type():
    """Case 6: Verify parser rejects wrong data type (list instead of dict)."""
    with pytest.raises(LLMResponseValidationError) as exc_info:
        LLMParser.parse_dict("[1, 2, 3]")
    assert "Expected JSON object" in str(exc_info.value)


def test_llm_parser_strict_confidence_bounds():
    """Case 7: Verify strict confidence bounds check."""
    assert LLMParser.validate_confidence_strict(0.95) == 0.95
    with pytest.raises(LLMResponseValidationError):
        LLMParser.validate_confidence_strict(1.5)
    with pytest.raises(LLMResponseValidationError):
        LLMParser.validate_confidence_strict(-0.1)
    with pytest.raises(LLMResponseValidationError):
        LLMParser.validate_confidence_strict("not-a-number")


def test_llm_parser_unknown_severity():
    """Case 8: Verify unknown severity rejection."""
    assert LLMParser.validate_severity("critical") == "CRITICAL"
    assert LLMParser.validate_severity("HIGH") == "HIGH"
    with pytest.raises(LLMResponseValidationError) as exc_info:
        LLMParser.validate_severity("CATASTROPHIC")
    assert "Unknown severity" in str(exc_info.value)


def test_llm_parser_missing_or_empty_fixed_code():
    """Case 9: Verify rejection of missing or empty fixed_code in fix payload."""
    payload_missing = {
        "issue_id": "ISSUE-001",
        "explanation": "Fix explanation",
        "confidence": 0.95,
        "auto_fix": True
    }
    with pytest.raises(LLMResponseValidationError) as exc:
        LLMParser.validate_fix_payload(payload_missing)
    assert "fixed_code" in str(exc.value)

    payload_empty = {
        "issue_id": "ISSUE-001",
        "explanation": "Fix explanation",
        "fixed_code": "   ",
        "confidence": 0.95,
        "auto_fix": True
    }
    with pytest.raises(LLMResponseValidationError) as exc:
        LLMParser.validate_fix_payload(payload_empty)
    assert "cannot be empty" in str(exc.value)

