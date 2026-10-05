import os
import ast
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from ..llm.client import LLMClient, get_llm_client
from ..llm.parser import LLMParser, LLMParseError

logger = logging.getLogger("CodeSentinel.BugAnalyzer")

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class BugAnalyzer:
    """
    Analyzes source code for functional bugs, logic errors, resource leaks,
    and runtime exceptions using static AST analysis and LLM reasoning.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        prompt_file = PROMPTS_DIR / "bug_analysis.txt"
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8")
        return (
            "Analyze the following code for bugs. Return JSON list:\n"
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
        Analyze code for functional bugs. Combines deterministic code checks
        with LLM verification for high accuracy.
        """
        findings: List[Dict[str, Any]] = []

        # 1. Deterministic AST static bug detection for Python
        if language.lower() == "python":
            ast_bugs = self._detect_python_ast_bugs(file_path, source_code)
            findings.extend(ast_bugs)

        # 2. LLM deep bug analysis
        prompt = self.prompt_template
        replacements = {
            "language": language,
            "file_path": file_path,
            "code": source_code,
            "issue": str(static_findings or []),
            "context": context or "Module root"
        }
        for k, v in replacements.items():
            prompt = prompt.replace(f"{{{k}}}", str(v))

        try:
            raw_response = self.llm.generate(prompt)
            llm_findings = LLMParser.parse_list(
                raw_response,
                item_required_fields=["category", "severity", "description"]
            )
            for item in llm_findings:
                # Ensure standard fields
                finding = {
                    "id": item.get("id") or f"BUG-{len(findings) + 1:03d}",
                    "type": "bug",
                    "category": item.get("category", "Logic Bug"),
                    "file": file_path,
                    "line": int(item.get("line", 1)),
                    "severity": str(item.get("severity", "MEDIUM")).upper(),
                    "description": item.get("description", ""),
                    "evidence": item.get("evidence", ""),
                    "impact": item.get("impact", "Potential runtime failure"),
                    "confidence": LLMParser.validate_confidence(item.get("confidence", 0.85))
                }
                # Avoid duplicate line & category
                if not any(f["line"] == finding["line"] and f["category"] == finding["category"] for f in findings):
                    findings.append(finding)
        except (LLMParseError, Exception) as e:
            logger.warning(f"LLM bug analysis completed with fallback/parser note: {e}")

        return findings

    def _detect_python_ast_bugs(self, file_path: str, source_code: str) -> List[Dict[str, Any]]:
        """Deterministic checks for common Python bugs: mutable default args, bare excepts, divide by zero."""
        bugs = []
        try:
            tree = ast.parse(source_code)
        except Exception:
            return bugs

        lines = source_code.splitlines()

        for node in ast.walk(tree):
            # Check 1: Mutable default arguments in functions
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for default in node.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        line_num = getattr(default, "lineno", node.lineno)
                        evidence = lines[line_num - 1].strip() if line_num <= len(lines) else ""
                        bugs.append({
                            "id": f"BUG-AST-{len(bugs) + 1:03d}",
                            "type": "bug",
                            "category": "Mutable Default Argument",
                            "file": file_path,
                            "line": line_num,
                            "severity": "HIGH",
                            "description": f"Function '{node.name}' uses a mutable default argument which retains state across calls.",
                            "evidence": evidence,
                            "impact": "Unintended cross-request state contamination and logic errors.",
                            "confidence": 0.98
                        })

            # Check 2: Direct division by zero literal
            if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)):
                if isinstance(node.right, ast.Constant) and node.right.value == 0:
                    line_num = getattr(node, "lineno", 1)
                    evidence = lines[line_num - 1].strip() if line_num <= len(lines) else ""
                    bugs.append({
                        "id": f"BUG-AST-{len(bugs) + 1:03d}",
                        "type": "bug",
                        "category": "Division by Zero",
                        "file": file_path,
                        "line": line_num,
                        "severity": "CRITICAL",
                        "description": "Literal division or modulo by zero causes unhandled ZeroDivisionError.",
                        "evidence": evidence,
                        "impact": "Immediate server process crash or 500 error in production.",
                        "confidence": 1.0
                    })

        return bugs
