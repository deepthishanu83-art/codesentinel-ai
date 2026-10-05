import os
import ast
import re
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from ..llm.client import LLMClient, get_llm_client
from ..llm.parser import LLMParser, LLMParseError

logger = logging.getLogger("CodeSentinel.CodeQualityAnalyzer")

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class CodeQualityAnalyzer:
    """
    Identifies code smells, dead code, anti-patterns, maintainability issues,
    and poor error handling while keeping security concerns separate.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        prompt_file = PROMPTS_DIR / "code_review.txt"
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8")
        return (
            "Analyze the following code for code quality smells. Return JSON list:\n"
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
        """Analyze code for code quality smells and maintainability anti-patterns."""
        findings: List[Dict[str, Any]] = []

        # 1. Deterministic AST quality inspection for Python
        if language.lower() == "python":
            ast_smells = self._detect_python_ast_smells(file_path, source_code)
            findings.extend(ast_smells)

        # 2. LLM code quality reasoning
        prompt = self.prompt_template
        replacements = {
            "language": language,
            "file_path": file_path,
            "code": source_code,
            "issue": str(static_findings or []),
            "context": context or "Module scope"
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
                # Ensure type is strictly code_smell
                finding = {
                    "id": item.get("id") or f"QUALITY-{len(findings) + 1:03d}",
                    "type": "code_smell",
                    "category": item.get("category", "Code Smell"),
                    "file": file_path,
                    "line": int(item.get("line", 1)),
                    "severity": str(item.get("severity", "LOW")).upper(),
                    "description": item.get("description", ""),
                    "evidence": item.get("evidence", ""),
                    "impact": item.get("impact", "Maintainability and technical debt"),
                    "confidence": LLMParser.validate_confidence(item.get("confidence", 0.85))
                }
                if not any(f["line"] == finding["line"] and f["category"] == finding["category"] for f in findings):
                    findings.append(finding)
        except (LLMParseError, Exception) as e:
            logger.warning(f"LLM quality analysis note: {e}")

        return findings

    def _detect_python_ast_smells(self, file_path: str, source_code: str) -> List[Dict[str, Any]]:
        """Deterministic detection for bare except clauses, wildcard imports, and pass in except."""
        smells = []
        try:
            tree = ast.parse(source_code)
        except Exception:
            return smells

        lines = source_code.splitlines()

        for node in ast.walk(tree):
            line_no = getattr(node, "lineno", 1)
            evidence = lines[line_no - 1].strip() if line_no <= len(lines) else ""

            # Check 1: Bare except or exception swallowing (except: pass or except Exception: pass)
            if isinstance(node, ast.ExceptHandler):
                if node.type is None:
                    smells.append({
                        "id": f"QUALITY-{len(smells) + 1:03d}",
                        "type": "code_smell",
                        "category": "Bare Except Clause",
                        "file": file_path,
                        "line": line_no,
                        "severity": "MEDIUM",
                        "description": "Bare 'except:' catches SystemExit, KeyboardInterrupt, and masks critical errors.",
                        "evidence": evidence,
                        "impact": "Suppresses fatal process signals and obscures debugging traces.",
                        "confidence": 0.98
                    })
                # Check for swallowed exception (only pass inside body)
                if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                    smells.append({
                        "id": f"QUALITY-{len(smells) + 1:03d}",
                        "type": "code_smell",
                        "category": "Swallowed Exception",
                        "file": file_path,
                        "line": line_no,
                        "severity": "LOW",
                        "description": "Exception caught and silently swallowed with 'pass'.",
                        "evidence": evidence,
                        "impact": "Silent failures make diagnosing production errors difficult.",
                        "confidence": 0.95
                    })

            # Check 2: Wildcard import (from module import *)
            if isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    if alias.name == "*":
                        smells.append({
                            "id": f"QUALITY-{len(smells) + 1:03d}",
                            "type": "code_smell",
                            "category": "Wildcard Import",
                            "file": file_path,
                            "line": line_no,
                            "severity": "LOW",
                            "description": f"Wildcard import 'from {node.module} import *' pollutes namespace.",
                            "evidence": evidence,
                            "impact": "Namespace pollution and variable collision risks.",
                            "confidence": 1.0
                        })

        # Check 3: Unused imports
        imported_symbols = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname or alias.name
                    imported_symbols[name] = (node.lineno, f"import {alias.name}")
            elif isinstance(node, ast.ImportFrom):
                if node.module != "__future__":
                    for alias in node.names:
                        if alias.name != "*":
                            name = alias.asname or alias.name
                            imported_symbols[name] = (node.lineno, f"from {node.module} import {alias.name}")

        used_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and not isinstance(getattr(node, "ctx", None), ast.Store):
                used_names.add(node.id)
            elif isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
                used_names.add(node.value.id)

        for sym, (line_no, import_stmt) in imported_symbols.items():
            if sym not in used_names:
                evidence = lines[line_no - 1].strip() if line_no <= len(lines) else import_stmt
                smells.append({
                    "id": f"QUALITY-{len(smells) + 1:03d}",
                    "type": "code_smell",
                    "category": "Unused Import",
                    "file": file_path,
                    "line": line_no,
                    "severity": "LOW",
                    "description": f"Imported symbol '{sym}' is never referenced in code.",
                    "evidence": evidence,
                    "impact": "Unnecessary memory overhead and dead dependency.",
                    "confidence": 0.95
                })

        return smells
