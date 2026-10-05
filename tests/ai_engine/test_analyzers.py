import pytest
from ai_engine.analyzers.security_analyzer import SecurityAnalyzer
from ai_engine.analyzers.bug_analyzer import BugAnalyzer
from ai_engine.analyzers.code_quality_analyzer import CodeQualityAnalyzer
from ai_engine.llm.client import MockLLMClient


@pytest.fixture
def mock_llm():
    return MockLLMClient()


def test_sql_injection_detection(mock_llm):
    """
    Test real example from prompt:
    query = "SELECT * FROM users WHERE id=" + user_id
    Should be flagged as SQL Injection with evidence.
    """
    code = """
def get_user(db, user_id):
    query = "SELECT * FROM users WHERE id=" + user_id
    cursor = db.cursor()
    cursor.execute(query)
    return cursor.fetchone()
"""
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("app.py", "python", code)

    sql_findings = [f for f in findings if "SQL" in f["category"]]
    assert len(sql_findings) >= 1
    target = sql_findings[0]
    assert target["type"] == "security"
    assert target["severity"] == "CRITICAL"
    assert target["cwe_id"] == "CWE-89"
    assert "query = " in target["evidence"]
    assert target["confidence"] >= 0.90


def test_hardcoded_secret_detection(mock_llm):
    """Verify hardcoded secret credentials are detected with evidence."""
    code = 'JWT_SECRET_KEY = "hardcoded_super_insecure_jwt_secret_token_12345"'
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("config.py", "python", code)

    secret_findings = [f for f in findings if "Secret" in f["category"]]
    assert len(secret_findings) >= 1
    assert secret_findings[0]["severity"] == "CRITICAL"
    assert "JWT_SECRET_KEY" in secret_findings[0]["evidence"]


def test_hardcoded_password_admin123(mock_llm):
    """Verify detection of password = 'admin123' as required by prompt."""
    code = 'password = "admin123"'
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("auth.py", "python", code)

    pwd_findings = [f for f in findings if "Password" in f["category"] or "Secret" in f["category"]]
    assert len(pwd_findings) >= 1
    assert pwd_findings[0]["severity"] in ("CRITICAL", "HIGH")
    assert "admin123" in pwd_findings[0]["evidence"]


def test_eval_misuse_detection(mock_llm):
    """Verify eval() call is detected as remote code execution."""
    code = """
def calculate(user_expr):
    result = eval(user_input)
    return result
"""
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("calc.py", "python", code)

    eval_findings = [f for f in findings if "eval" in f["category"].lower()]
    assert len(eval_findings) >= 1
    assert eval_findings[0]["cwe_id"] == "CWE-95"
    assert eval_findings[0]["severity"] == "CRITICAL"


def test_exec_misuse_detection(mock_llm):
    """Verify exec(user_input) call is detected as remote code execution."""
    code = """
def run_dynamic(user_input):
    exec(user_input)
"""
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("runner.py", "python", code)

    exec_findings = [f for f in findings if "exec" in f["category"].lower() or "eval" in f["category"].lower()]
    assert len(exec_findings) >= 1
    assert exec_findings[0]["severity"] == "CRITICAL"
    assert "exec(user_input)" in exec_findings[0]["evidence"]


def test_unsafe_subprocess_detection(mock_llm):
    """Verify subprocess.run(command, shell=True) is flagged as required by prompt."""
    code = """
import subprocess
def execute(command):
    subprocess.run(command, shell=True)
"""
    analyzer = SecurityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("network.py", "python", code)

    sub_findings = [f for f in findings if "shell=True" in f["category"] or "Command Injection" in f["category"]]
    assert len(sub_findings) >= 1
    assert sub_findings[0]["severity"] == "CRITICAL"
    assert "shell=True" in sub_findings[0]["evidence"]


def test_bug_analyzer_mutable_default_and_zero_div(mock_llm):
    """Verify bug analyzer detects mutable default arguments and division by zero."""
    code = """
def append_item(val, container=[]):
    container.append(val)
    return container

def compute():
    x = 100 / 0
    return x
"""
    analyzer = BugAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("bugs.py", "python", code)

    categories = [f["category"] for f in findings]
    assert "Mutable Default Argument" in categories
    assert "Division by Zero" in categories


def test_code_quality_bare_except_and_wildcard(mock_llm):
    """Verify code quality analyzer flags bare except and wildcard imports."""
    code = """
from math import *

def safe_run():
    try:
        do_work()
    except:
        pass
"""
    analyzer = CodeQualityAnalyzer(llm_client=mock_llm)
    findings = analyzer.analyze("smells.py", "python", code)

    categories = [f["category"] for f in findings]
    assert "Bare Except Clause" in categories or "Swallowed Exception" in categories
    assert "Wildcard Import" in categories
