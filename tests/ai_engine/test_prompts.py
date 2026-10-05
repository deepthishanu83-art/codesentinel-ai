from pathlib import Path
import pytest

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "ai_engine" / "prompts"

EXPECTED_PROMPTS = [
    "bug_analysis.txt",
    "security_analysis.txt",
    "code_review.txt",
    "fix_generation.txt",
    "readme_generation.txt",
    "risk_analysis.txt",
]


def test_all_prompt_files_exist():
    """Verify that all six required prompt template files exist."""
    for filename in EXPECTED_PROMPTS:
        path = PROMPTS_DIR / filename
        assert path.exists(), f"Prompt file missing: {filename}"
        assert path.stat().st_size > 0, f"Prompt file is empty: {filename}"


def test_prompt_formatting_placeholders():
    """Verify prompt templates contain standard placeholders and format cleanly."""
    # Test bug_analysis
    bug_txt = (PROMPTS_DIR / "bug_analysis.txt").read_text(encoding="utf-8")
    assert "{language}" in bug_txt
    assert "{file_path}" in bug_txt
    assert "{code}" in bug_txt
    formatted_bug = bug_txt.replace("{language}", "python").replace("{file_path}", "app.py").replace("{code}", "x = 1")
    assert "Language: python" in formatted_bug
    assert "File Path: app.py" in formatted_bug

    # Test security_analysis
    sec_txt = (PROMPTS_DIR / "security_analysis.txt").read_text(encoding="utf-8")
    assert "{language}" in sec_txt
    assert "{file_path}" in sec_txt
    formatted_sec = sec_txt.replace("{language}", "python").replace("{file_path}", "auth.py")
    assert "auth.py" in formatted_sec

    # Test fix_generation
    fix_txt = (PROMPTS_DIR / "fix_generation.txt").read_text(encoding="utf-8")
    assert "{issue_id}" in fix_txt
    assert "{category}" in fix_txt
    formatted_fix = fix_txt.replace("{issue_id}", "ISSUE-001").replace("{category}", "SQL Injection")
    assert "ISSUE-001" in formatted_fix
    assert "SQL Injection" in formatted_fix
