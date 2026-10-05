# CodeSentinel AI — Member 2 (AI Engine) Integration Specification

This document defines the strict integration contract for connecting the **AI Engine** with upstream (Repository Scanner / GitHub Integration - Member 1) and downstream (Validation Pipeline / CI - Member 3) modules.

---

## 1. High-Level Workflow Contract

```
Upstream (Member 1: Scanner / GitHub)
  │
  │  Source Code + Target File + Metadata
  ▼
[SecurityAnalyzer / BugAnalyzer / CodeQualityAnalyzer]
  │
  │  List of Structured Findings
  ▼
[FixGenerator] ──► [PatchGenerator]
  │                     │
  │  Fix Result         ▼
  │               Unified Diff for PR
  ▼
Downstream Validation Pipeline (Member 3: Pytest / Syntax Checks)
  │
  │  Validation Status (syntax_passed, tests_passed, security_scan_passed)
  ▼
[ConfidenceEngine]
  │
  │  Auto-Fix Decision (auto_fix_allowed: true/false)
  ▼
[RiskCalculator] ──► [ReleaseDecisionEngine]
  │
  ▼
Release Recommendation (DO_NOT_RELEASE / RELEASE_WITH_WARNINGS / RELEASE_READY)
```

---

## 2. Component Interfaces & Schemas

### A. Code Analysis Interface
Used by Member 1 (Scanner) to discover and categorize issues.

#### Python Call:
```python
from ai_engine.analyzers import SecurityAnalyzer, BugAnalyzer, CodeQualityAnalyzer

analyzer = SecurityAnalyzer() # or BugAnalyzer() / CodeQualityAnalyzer()
findings = analyzer.analyze(
    file_path="app.py",
    language="python",
    source_code="...",
    static_findings=[], # Optional preliminary findings
    context="module"    # Optional enclosing function/class
)
```

#### Output Schema (`List[Finding]`):
```json
[
  {
    "id": "SEC-001",
    "type": "security",
    "category": "SQL Injection",
    "cwe_id": "CWE-89",
    "file": "app.py",
    "line": 42,
    "severity": "CRITICAL",
    "description": "SQL query formed by string concatenation without parameterization.",
    "evidence": "query = \"SELECT * FROM users WHERE id=\" + user_id",
    "impact": "Unrestricted database read/write/drop access via injection.",
    "confidence": 0.96
  }
]
```

---

### B. Fix & Patch Generation Interface
Used by Member 1 to create fix branches and pull requests.

#### Python Call:
```python
from ai_engine.fix_engine import FixGenerator, PatchGenerator

# 1. Generate minimal fix
fix_gen = FixGenerator()
fix_result = fix_gen.generate_fix(
    issue=findings[0],
    source_code=source_code,
    language="python",
    context="login_function"
)

# 2. Generate standard unified diff patch
patch_data = PatchGenerator.create_patch(
    original_code=source_code,
    fixed_code=modified_code,
    file_path="app.py"
)
```

#### Fix Result Schema:
```json
{
  "issue_id": "SEC-001",
  "explanation": "Replaced dynamic string concatenation with parameterized prepared statement placeholder.",
  "root_cause": "Untrusted input concatenated into raw SQL string without database parameter binding.",
  "impact": "Eliminates SQL injection vulnerability (CWE-89), securing the database against data leakage and tampering.",
  "suggested_fix": "Use query parameter placeholders (%s or ?) and pass user input in parameters tuple.",
  "fixed_code": "query = \"SELECT * FROM users WHERE id = %s\"\ncursor.execute(query, (user_id,))",
  "confidence": 0.95,
  "auto_fix": true
}
```

#### Patch Output Schema:
```json
{
  "file": "app.py",
  "diff": "--- a/app.py\n+++ b/app.py\n@@ -42,2 +42,2 @@\n-query = \"SELECT * FROM users WHERE id=\" + user_id\n+query = \"SELECT * FROM users WHERE id=%s\"\n+cursor.execute(query, (user_id,))\n",
  "additions": 2,
  "deletions": 1,
  "total_changes": 3,
  "is_empty": false
}
```

---

### C. Validation & Confidence Feedback Loop
Used by Member 3 (Validation) to feed compiler/test results back into the AI Engine.

#### Python Call:
```python
from ai_engine.fix_engine import ConfidenceEngine

eval_result = ConfidenceEngine.evaluate(
    category=finding["category"],
    detection_confidence=finding["confidence"],
    ai_confidence=fix_result["confidence"],
    patch_size=patch_data["total_changes"],
    severity=finding["severity"],
    validation_status={
        "syntax_passed": True,        # Required: Did compile() / ast.parse() pass?
        "security_scan_passed": True, # Required: Re-scan confirms original flaw gone & no new flaws?
        "tests_passed": True          # Optional: Did pytest / npm test pass?
    }
)
```

#### Confidence Output Schema:
```json
{
  "confidence": 1.0,
  "auto_fix_allowed": true,
  "reason": "High confidence (1.0) well-defined remediation pattern for 'SQL Injection'."
}
```
*Note: If `syntax_passed` is `False`, `confidence` drops to `0.0` and `auto_fix_allowed` is `false`.*

---

### D. Release Risk Calculation & Decision Interface
Used by the Dashboard / CI Gate to determine release safety.

#### Python Call:
```python
from ai_engine.risk_engine import RiskCalculator, ReleaseDecisionEngine

# 1. Calculate numerical risk
risk_metrics = RiskCalculator.calculate_risk(issues=all_detected_issues)

# 2. Evaluate release gate decision
decision = ReleaseDecisionEngine.evaluate_decision(risk_metrics=risk_metrics)
```

#### Risk Metrics Schema:
```json
{
  "risk_score": 68,
  "critical_count": 1,
  "high_count": 0,
  "medium_count": 0,
  "low_count": 0,
  "security_count": 1,
  "bug_count": 0,
  "code_smell_count": 0,
  "total_issues": 1,
  "raw_score": 14.4,
  "formula": "raw_score = sum(severity_weight * confidence * type_multiplier); score = min(100, round(raw_score * 2.8)); critical_safeguard = max(65, score) if critical_count > 0"
}
```

#### Release Decision Schema:
```json
{
  "decision": "DO_NOT_RELEASE",
  "reason": "1 critical security vulnerabilities remain unresolved.",
  "risk_score": 68,
  "blockers_count": 1,
  "recommendation": "Block deployment pipeline immediately. Remediate critical security vulnerabilities before promoting to production."
}
```

#### Release Decision Gates:
| Decision | Condition | Action |
|---|---|---|
| `DO_NOT_RELEASE` | `critical_count > 0` OR `risk_score >= 60` | Fail release pipeline, require security review |
| `RELEASE_WITH_WARNINGS` | `high_count > 0` OR `25 <= risk_score < 60` | Allow release with documented approval |
| `RELEASE_READY` | `risk_score < 25` AND `critical_count == 0` AND `high_count == 0` | Pass release gate cleanly |

---

## 3. Error Handling Contract

All components in `ai_engine` raise clean, structured exceptions:

```python
from ai_engine.llm import LLMParseError, LLMResponseValidationError, LLMClientError

try:
    data = LLMParser.parse_dict(raw_llm_output, required_fields=["issue_id", "fixed_code"])
except LLMParseError as e:
    # Handle malformed / non-JSON responses gracefully
    logger.error(f"Malformed LLM JSON: {e}")
except LLMResponseValidationError as e:
    # Handle missing required fields, empty fixed_code, or invalid bounds
    logger.error(f"Validation failure in LLM response: {e}")
except LLMClientError as e:
    # Handle upstream network / API timeout errors
    logger.error(f"API Provider communication error: {e}")
```

---

## 4. Configuration & Mock vs Production Separation

- **Production:** Set `AI_PROVIDER` (`gemini`, `openai`, `anthropic`) and `AI_API_KEY`.
- **Unit Testing / Offline Mode:** If no key is set or `AI_PROVIDER=mock`, the engine uses `MockLLMClient`, generating deterministic, reproducible test fixes without network calls.

---

## 5. Language Support & Analysis Scope (Honest Disclosure)

- **Python Analysis (Primary & Strongest):**
  Uses Python's native `ast` module for full Abstract Syntax Tree parsing and semantic node inspection. Detects parameterized vs string-concatenated SQL queries, literal division by zero, mutable default arguments, bare/swallowed exceptions, unused imports, dangerous `eval`/`exec`, and `subprocess(..., shell=True)` with high precision.

- **JavaScript / TypeScript Analysis (Pattern Heuristic):**
  Uses targeted regular expression and token heuristics to identify dangerous patterns (`eval()`, `child_process.exec()`, `.innerHTML =`, and hardcoded tokens). It does **not** embed an independent JS/TS compiler or Babel parser; it expects other static tooling (like ESLint or TypeScript compiler output from Member 1) to supplement complex type-checking.

