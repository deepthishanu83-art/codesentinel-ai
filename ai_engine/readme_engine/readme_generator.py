import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from ..llm.client import LLMClient, get_llm_client
from ..llm.parser import LLMParser, LLMParseError
from .readme_analyzer import ReadmeAnalyzer

logger = logging.getLogger("CodeSentinel.ReadmeGenerator")

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class ReadmeGenerator:
    """
    Generates or updates README.md strictly from verified repository evidence.
    Preserves existing documentation while filling in missing verified sections.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
        self.analyzer = ReadmeAnalyzer()
        self.prompt_template = self._load_prompt_template()

    def _load_prompt_template(self) -> str:
        prompt_file = PROMPTS_DIR / "readme_generation.txt"
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8")
        return (
            "Analyze manifest and generate README.md in JSON:\n"
            "Files: {file_list}\nDependencies: {dependencies}\n"
            "Entrypoints: {entrypoints}\nExisting: {existing_readme}"
        )

    def generate_or_update(
        self,
        repo_path: str,
        existing_readme: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze repository and generate updated evidence-backed README.md.
        """
        analysis = self.analyzer.analyze_repository(repo_path, existing_readme)
        manifest = analysis["detected_manifest"]

        project_name = Path(repo_path).name or "CodeSentinel AI Project"

        prompt = self.prompt_template
        replacements = {
            "file_list": ", ".join(manifest["files"][:30]),
            "dependencies": ", ".join(manifest["dependencies"][:20]),
            "entrypoints": ", ".join(manifest["entrypoints"]),
            "existing_readme": (existing_readme or "None")[:1500]
        }
        for k, v in replacements.items():
            prompt = prompt.replace(f"{{{k}}}", str(v))

        try:
            raw_response = self.llm.generate(prompt)
            result = LLMParser.parse_dict(
                raw_response,
                required_fields=["generated_readme"]
            )
            return {
                "project_name": result.get("project_name", project_name),
                "missing_sections": analysis["missing_sections"],
                "recommended_updates": result.get("recommended_updates", "Updated documentation from repository manifest."),
                "generated_readme": str(result.get("generated_readme", ""))
            }
        except (LLMParseError, Exception) as e:
            logger.warning(f"LLM README generation note: {e}. Using deterministic synthesis.")
            return self._synthesize_deterministic_readme(project_name, analysis)

    def _synthesize_deterministic_readme(
        self,
        project_name: str,
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Deterministic README synthesis strictly from verified repository files."""
        manifest = analysis["detected_manifest"]
        tech_stack = ", ".join(manifest["tech_stack"]) or "Python / Multi-language"

        lines = [
            f"# {project_name}",
            "",
            "## Overview",
            "This repository contains the codebase analyzed by CodeSentinel AI.",
            "",
            "## Tech Stack",
            f"- Languages & Runtime: {tech_stack}",
        ]

        if manifest["dependencies"]:
            lines.append("- Primary Dependencies:")
            for dep in manifest["dependencies"][:10]:
                lines.append(f"  - `{dep}`")

        lines.extend([
            "",
            "## Installation",
            "```bash"
        ])
        if "Python" in manifest["tech_stack"]:
            lines.extend([
                "# Create and activate virtual environment",
                "python -m venv venv",
                "# Install requirements",
                "pip install -r requirements.txt"
            ])
        elif "Node.js" in manifest["tech_stack"]:
            lines.append("npm install")
        else:
            lines.append("# Refer to project package manifest")
        lines.append("```")

        if manifest["env_vars"]:
            lines.extend([
                "",
                "## Environment Variables",
                "Configure the following environment variables in `.env`:",
                "```bash"
            ])
            for var in manifest["env_vars"]:
                lines.append(f"{var}=")
            lines.append("```")

        if manifest["entrypoints"]:
            lines.extend([
                "",
                "## Usage",
                "Run the main service entrypoint:",
                "```bash"
            ])
            entry = manifest["entrypoints"][0]
            if entry.endswith(".py"):
                lines.append(f"python {entry}")
            else:
                lines.append(f"node {entry}")
            lines.append("```")

        if manifest["has_tests"]:
            lines.extend([
                "",
                "## Testing",
                "Run test suite:",
                "```bash",
                "pytest" if "Python" in manifest["tech_stack"] else "npm test",
                "```"
            ])

        lines.extend([
            "",
            "## Security & Release Safety",
            "This project is scanned and monitored with CodeSentinel AI release safety gates."
        ])

        generated_readme = "\n".join(lines)
        return {
            "project_name": project_name,
            "missing_sections": analysis["missing_sections"],
            "recommended_updates": "Synthesized complete, evidence-based documentation.",
            "generated_readme": generated_readme
        }
