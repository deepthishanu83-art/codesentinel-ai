import os
import ast
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from ..llm.client import LLMClient, get_llm_client
from ..llm.parser import LLMParser, LLMParseError

logger = logging.getLogger("CodeSentinel.SecurityAnalyzer")

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class SecurityAnalyzer:
    """
    Detects and analyzes security vulnerabilities including SQL injection,
    command injection, eval/exec misuse, hardcoded secrets, insecure subprocess,
    and weak cryptographic primitives.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        prompt_file = PROMPTS_DIR / "security_analysis.txt"
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8")
        return (
            "Analyze the following code for security vulnerabilities. Return JSON list:\n"
            "Language: {language}\nFile: {file_path}\nContext: {context}\n"
            "Existing: {issue}\nCode:\n{code}"
        )

    def analyze(
        self,
        file_path: str,
        language: str,
        source_code: str,
        static_findings: Optional[List[Dict[str, Any]]] = None,
        context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze code for security vulnerabilities.
        Grounded in verifiable code evidence.
        """
        findings: List[Dict[str, Any]] = []

        # 1. Deterministic evidence-based static detection
        static_detected = self._detect_static_vulnerabilities(file_path, language, source_code)
        findings.extend(static_detected)

        # 2. LLM contextual security reasoning
        prompt = self.prompt_template
        replacements = {
            "language": language,
            "file_path": file_path,
            "code": source_code,
            "issue": str(static_findings or static_detected),
            "context": context or "Module scope"
        }
        for k, v in replacements.items():
            prompt = prompt.replace(f"{{{k}}}", str(v))

        try:
            raw_response = self.llm.generate(prompt)
            llm_findings = LLMParser.parse_list(
                raw_response,
                item_required_fields=["category", "severity", "evidence"]
            )
            for item in llm_findings:
                finding = {
                    "id": item.get("id") or f"SEC-{len(findings) + 1:03d}",
                    "type": "security",
                    "category": item.get("category", "Security Vulnerability"),
                    "cwe_id": item.get("cwe_id"),
                    "file": file_path,
                    "line": int(item.get("line", 1)),
                    "severity": str(item.get("severity", "HIGH")).upper(),
                    "description": item.get("description", ""),
                    "evidence": item.get("evidence", ""),
                    "impact": item.get("impact", "Potential security exploit"),
                    "confidence": LLMParser.validate_confidence(item.get("confidence", 0.90))
                }
                # Deduplicate by line number and category
                if not any(f["line"] == finding["line"] and f["category"] == finding["category"] for f in findings):
                    findings.append(finding)
        except (LLMParseError, Exception) as e:
            logger.warning(f"LLM security analysis note: {e}")

        return findings

    def _detect_static_vulnerabilities(self, file_path: str, language: str, source_code: str) -> List[Dict[str, Any]]:
        """Deterministic pattern and AST detection for critical vulnerabilities."""
        detected = []
        lines = source_code.splitlines()

        # Hardcoded secrets regex check (works across Python, JS, TS)
        secret_patterns = [
            (r'(?i)([a-z0-9_]*(?:jwt_secret|api_key|stripe_secret|auth_token|secret_key|private_key)[a-z0-9_]*)\s*=\s*["\']([a-zA-Z0-9_\-\.\!@#$%^&*]{5,})["\']', "Hardcoded Secret", "CWE-798", "CRITICAL"),
            (r'(?i)([a-z0-9_]*password[a-z0-9_]*)\s*=\s*["\']([^"\']{4,})["\']', "Hardcoded Password", "CWE-798", "HIGH"),
            (r'sk_live_[0-9a-zA-Z]{24,}', "Stripe Live Secret Key", "CWE-798", "CRITICAL"),
            (r'ghp_[0-9a-zA-Z]{36}', "GitHub Personal Access Token", "CWE-798", "CRITICAL"),
        ]

        for line_idx, line in enumerate(lines, start=1):
            for pattern, cat, cwe, sev in secret_patterns:
                if re.search(pattern, line):
                    detected.append({
                        "id": f"SEC-{len(detected) + 1:03d}",
                        "type": "security",
                        "category": cat,
                        "cwe_id": cwe,
                        "file": file_path,
                        "line": line_idx,
                        "severity": sev,
                        "description": f"Hardcoded credential or token detected in source code.",
                        "evidence": line.strip(),
                        "impact": "Credentials exposed in source repositories can lead to system takeover.",
                        "confidence": 0.98
                    })
                    break

        if language.lower() == "python":
            detected.extend(self._detect_python_ast_security(file_path, source_code, lines))
        elif language.lower() in ("javascript", "typescript", "js", "ts"):
            detected.extend(self._detect_js_security(file_path, lines))

        return detected

    def _detect_python_ast_security(self, file_path: str, source_code: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Inspect Python AST for SQL injection, command injection, eval/exec, weak crypto, unsafe subprocess."""
        results = []
        try:
            tree = ast.parse(source_code)
        except Exception:
            # Fallback regex checks for SQL injection if code contains syntax errors
            for idx, line in enumerate(lines, start=1):
                if re.search(r'(?i)select\s+.*\s+from\s+.*where\s+.*[\+\%]', line) or 'WHERE id="' in line or "WHERE id='" in line or 'WHERE id=" +' in line or "WHERE id=' +" in line or 'WHERE username =' in line:
                    results.append({
                        "id": f"SEC-{len(results) + 1:03d}",
                        "type": "security",
                        "category": "SQL Injection",
                        "cwe_id": "CWE-89",
                        "file": file_path,
                        "line": idx,
                        "severity": "CRITICAL",
                        "description": "SQL query formed by string concatenation or interpolation without parameterization.",
                        "evidence": line.strip(),
                        "impact": "Unrestricted database read/write/drop access via injection.",
                        "confidence": 0.96
                    })
            return results

        for node in ast.walk(tree):
            line_no = getattr(node, "lineno", 1)
            evidence_line = lines[line_no - 1].strip() if line_no <= len(lines) else ""

            # Check 1: eval() / exec()
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                if node.func.id in ("eval", "exec"):
                    results.append({
                        "id": f"SEC-{len(results) + 1:03d}",
                        "type": "security",
                        "category": "Remote Code Execution via eval/exec",
                        "cwe_id": "CWE-95",
                        "file": file_path,
                        "line": line_no,
                        "severity": "CRITICAL",
                        "description": f"Dangerous built-in '{node.func.id}()' executes arbitrary dynamic code.",
                        "evidence": evidence_line,
                        "impact": "Remote code execution (RCE) on host server.",
                        "confidence": 0.99
                    })

            # Check 2: Unsafe subprocess (shell=True) or os.system
            if isinstance(node, ast.Call):
                # os.system(...)
                if isinstance(node.func, ast.Attribute) and node.func.attr == "system":
                    if isinstance(node.func.value, ast.Name) and node.func.value.id == "os":
                        results.append({
                            "id": f"SEC-{len(results) + 1:03d}",
                            "type": "security",
                            "category": "Command Injection",
                            "cwe_id": "CWE-78",
                            "file": file_path,
                            "line": line_no,
                            "severity": "CRITICAL",
                            "description": "Direct execution via os.system() is vulnerable to command injection.",
                            "evidence": evidence_line,
                            "impact": "Host OS command takeover.",
                            "confidence": 0.96
                        })
                # subprocess with shell=True
                for kw in node.keywords:
                    if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                        results.append({
                            "id": f"SEC-{len(results) + 1:03d}",
                            "type": "security",
                            "category": "Command Injection via shell=True",
                            "cwe_id": "CWE-78",
                            "file": file_path,
                            "line": line_no,
                            "severity": "CRITICAL",
                            "description": "Subprocess called with shell=True allows command chaining and injection.",
                            "evidence": evidence_line,
                            "impact": "Remote command execution through shell expansion.",
                            "confidence": 0.97
                        })

            # Check 3: SQL Injection (cursor.execute with concat or f-string, or string concat with SQL keywords)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "execute":
                if node.args:
                    arg0 = node.args[0]
                    if isinstance(arg0, ast.BinOp) and isinstance(arg0.op, (ast.Add, ast.Mod)):
                        results.append({
                            "id": f"SEC-{len(results) + 1:03d}",
                            "type": "security",
                            "category": "SQL Injection",
                            "cwe_id": "CWE-89",
                            "file": file_path,
                            "line": line_no,
                            "severity": "CRITICAL",
                            "description": "SQL statement dynamically constructed using string concatenation or '%' formatting in execute().",
                            "evidence": evidence_line,
                            "impact": "Full database breach or unauthorized query manipulation.",
                            "confidence": 0.97
                        })
                    elif isinstance(arg0, ast.JoinedStr):  # f-string
                        results.append({
                            "id": f"SEC-{len(results) + 1:03d}",
                            "type": "security",
                            "category": "SQL Injection",
                            "cwe_id": "CWE-89",
                            "file": file_path,
                            "line": line_no,
                            "severity": "CRITICAL",
                            "description": "SQL statement dynamically constructed using f-string interpolation in execute().",
                            "evidence": evidence_line,
                            "impact": "Arbitrary SQL execution by injecting into f-string variables.",
                            "confidence": 0.97
                        })

            # Check 4: Variable assignment constructing SQL with concatenation/f-string
            if isinstance(node, ast.Assign):
                if isinstance(node.value, (ast.BinOp, ast.JoinedStr)):
                    # Check if string contains SQL tokens
                    line_text = evidence_line.upper()
                    if ("SELECT " in line_text or "INSERT " in line_text or "UPDATE " in line_text or "DELETE " in line_text) and " WHERE " in line_text:
                        results.append({
                            "id": f"SEC-{len(results) + 1:03d}",
                            "type": "security",
                            "category": "SQL Injection",
                            "cwe_id": "CWE-89",
                            "file": file_path,
                            "line": line_no,
                            "severity": "CRITICAL",
                            "description": "User-supplied query dynamically assembled via string concatenation.",
                            "evidence": evidence_line,
                            "impact": "Vulnerable to SQL syntax tampering and authentication bypass.",
                            "confidence": 0.95
                        })

            # Check 5: Weak cryptographic hash (MD5, SHA1)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr in ("md5", "sha1"):
                    results.append({
                        "id": f"SEC-{len(results) + 1:03d}",
                        "type": "security",
                        "category": "Weak Cryptographic Hash",
                        "cwe_id": "CWE-327",
                        "file": file_path,
                        "line": line_no,
                        "severity": "MEDIUM",
                        "description": f"Use of broken or collision-prone hashing algorithm '{node.func.attr}'.",
                        "evidence": evidence_line,
                        "impact": "Hash collision attacks and password cracking vulnerabilities.",
                        "confidence": 0.96
                    })

        return results

    def _detect_js_security(self, file_path: str, lines: List[str]) -> List[Dict[str, Any]]:
        """Regex/pattern checks for JS/TS security issues (eval, exec, innerHTML)."""
        results = []
        for line_no, line in enumerate(lines, start=1):
            if re.search(r'\beval\s*\(', line):
                results.append({
                    "id": f"SEC-{len(results) + 1:03d}",
                    "type": "security",
                    "category": "Remote Code Execution via eval()",
                    "cwe_id": "CWE-95",
                    "file": file_path,
                    "line": line_no,
                    "severity": "CRITICAL",
                    "description": "eval() evaluates arbitrary JavaScript strings in current execution context.",
                    "evidence": line.strip(),
                    "impact": "Remote code execution / arbitrary script execution.",
                    "confidence": 0.98
                })
            if re.search(r'\.innerHTML\s*=', line):
                results.append({
                    "id": f"SEC-{len(results) + 1:03d}",
                    "type": "security",
                    "category": "Cross-Site Scripting (XSS)",
                    "cwe_id": "CWE-79",
                    "file": file_path,
                    "line": line_no,
                    "severity": "HIGH",
                    "description": "Direct assignment to innerHTML with unescaped user data.",
                    "evidence": line.strip(),
                    "impact": "Client-side script execution and session hijacking.",
                    "confidence": 0.94
                })
            if re.search(r'\bexec\s*\([^,)]*\+', line):
                results.append({
                    "id": f"SEC-{len(results) + 1:03d}",
                    "type": "security",
                    "category": "Command Injection",
                    "cwe_id": "CWE-78",
                    "file": file_path,
                    "line": line_no,
                    "severity": "CRITICAL",
                    "description": "child_process.exec concatenating arguments without sanitization.",
                    "evidence": line.strip(),
                    "impact": "Shell command injection on server host.",
                    "confidence": 0.95
                })

        return results
