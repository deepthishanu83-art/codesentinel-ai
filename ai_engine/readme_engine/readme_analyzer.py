import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional


class ReadmeAnalyzer:
    """
    Analyzes actual repository evidence to assess README completeness
    and detect missing, outdated, or undocumented sections.
    """

    STANDARD_SECTIONS = [
        "Overview",
        "Architecture",
        "Tech Stack",
        "Installation",
        "Environment Variables",
        "Usage",
        "API Documentation",
        "Testing",
        "Security",
        "Deployment",
        "Project Structure"
    ]

    def analyze_repository(
        self,
        repo_path: str,
        existing_readme: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze repo manifest and compare with existing README content.
        """
        repo_dir = Path(repo_path)
        manifest = self._extract_repository_manifest(repo_dir)

        # If existing README not provided as string, try to read from repo
        if existing_readme is None:
            readme_path = repo_dir / "README.md"
            if readme_path.exists():
                existing_readme = readme_path.read_text(encoding="utf-8", errors="ignore")

        existing_sections = []
        if existing_readme:
            existing_sections = self._extract_sections_from_markdown(existing_readme)

        # Identify missing sections based on manifest evidence
        missing_sections = []
        for section in self.STANDARD_SECTIONS:
            # Check if this section is mentioned in existing headings
            found = any(re.search(rf"\b{re.escape(section)}\b", s, re.IGNORECASE) for s in existing_sections)
            if not found:
                missing_sections.append(section)

        # Compute completeness score
        total_standard = len(self.STANDARD_SECTIONS)
        present_count = total_standard - len(missing_sections)
        completeness = int((present_count / total_standard) * 100) if existing_readme else 0

        recommendations = []
        if not existing_readme:
            recommendations.append("Repository lacks a README.md file entirely.")
        else:
            if "Environment Variables" in missing_sections and manifest["env_vars"]:
                recommendations.append(f"Document detected environment variables: {', '.join(manifest['env_vars'])}")
            if "Installation" in missing_sections and manifest["dependencies"]:
                recommendations.append("Add installation and setup instructions based on package dependencies.")
            if "Testing" in missing_sections and manifest["has_tests"]:
                recommendations.append("Add instructions for executing the test suite.")

        return {
            "has_existing_readme": bool(existing_readme),
            "existing_sections": existing_sections,
            "missing_sections": missing_sections,
            "completeness_score": completeness,
            "detected_manifest": manifest,
            "recommendations": recommendations
        }

    def _extract_repository_manifest(self, repo_dir: Path) -> Dict[str, Any]:
        """Inspect directory for real files, dependencies, tests, and env variables."""
        manifest: Dict[str, Any] = {
            "dependencies": [],
            "env_vars": [],
            "entrypoints": [],
            "has_tests": False,
            "tech_stack": [],
            "files": []
        }

        if not repo_dir.exists():
            return manifest

        for root, dirs, files in os.walk(repo_dir):
            # Ignore hidden and vendor dirs
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", "venv", "__pycache__")]
            for f in files:
                rel = os.path.relpath(os.path.join(root, f), repo_dir)
                manifest["files"].append(rel)

                # Check tests
                if "test" in f.lower() or "tests" in rel.lower():
                    manifest["has_tests"] = True

                # Check entrypoints
                if f in ("app.py", "main.py", "server.js", "index.ts", "index.js"):
                    manifest["entrypoints"].append(rel)

                # Check Python dependencies
                if f == "requirements.txt":
                    manifest["tech_stack"].append("Python")
                    try:
                        content = Path(root, f).read_text(encoding="utf-8", errors="ignore")
                        manifest["dependencies"].extend([
                            line.strip() for line in content.splitlines()
                            if line.strip() and not line.startswith("#")
                        ][:10])
                    except Exception:
                        pass

                # Check Node dependencies
                if f == "package.json":
                    manifest["tech_stack"].append("Node.js")
                    try:
                        import json
                        pkg = json.loads(Path(root, f).read_text(encoding="utf-8", errors="ignore"))
                        deps = list(pkg.get("dependencies", {}).keys())
                        manifest["dependencies"].extend(deps[:10])
                    except Exception:
                        pass

                # Check env files
                if f.startswith(".env"):
                    try:
                        content = Path(root, f).read_text(encoding="utf-8", errors="ignore")
                        for line in content.splitlines():
                            if "=" in line and not line.strip().startswith("#"):
                                var_name = line.split("=")[0].strip()
                                if var_name and var_name not in manifest["env_vars"]:
                                    manifest["env_vars"].append(var_name)
                    except Exception:
                        pass

        # Deduplicate
        manifest["tech_stack"] = list(set(manifest["tech_stack"]))
        manifest["dependencies"] = list(set(manifest["dependencies"]))
        return manifest

    def _extract_sections_from_markdown(self, markdown_text: str) -> List[str]:
        """Extract markdown heading titles."""
        headings = []
        for line in markdown_text.splitlines():
            match = re.match(r"^#{1,3}\s+(.+)$", line.strip())
            if match:
                headings.append(match.group(1).strip())
        return headings
