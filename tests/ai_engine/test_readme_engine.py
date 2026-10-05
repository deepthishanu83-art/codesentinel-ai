import pytest
from pathlib import Path
from ai_engine.readme_engine.readme_analyzer import ReadmeAnalyzer
from ai_engine.readme_engine.readme_generator import ReadmeGenerator
from ai_engine.llm.client import MockLLMClient


@pytest.fixture
def sample_repo_path(tmp_path):
    repo = tmp_path / "sample_repo"
    repo.mkdir()
    (repo / "app.py").write_text("print('hello')", encoding="utf-8")
    (repo / "requirements.txt").write_text("pytest\nrequests\n", encoding="utf-8")
    tests_dir = repo / "tests"
    tests_dir.mkdir()
    (tests_dir / "test_sample.py").write_text("def test_ok(): pass", encoding="utf-8")
    (repo / "README.md").write_text("# Sample\n## Overview\nSample project\n", encoding="utf-8")
    return str(repo)



def test_readme_analyzer_missing_readme(tmp_path):
    """Verify ReadmeAnalyzer detects completely missing README in empty directory."""
    analyzer = ReadmeAnalyzer()
    analysis = analyzer.analyze_repository(str(tmp_path))

    assert analysis["has_existing_readme"] is False
    assert len(analysis["missing_sections"]) == len(ReadmeAnalyzer.STANDARD_SECTIONS)
    assert analysis["completeness_score"] == 0


def test_readme_analyzer_with_existing_content(tmp_path):
    """Verify ReadmeAnalyzer identifies existing vs missing sections."""
    readme_file = tmp_path / "README.md"
    readme_file.write_text("""
# Test Project
## Overview
A demo application.
## Installation
pip install -r requirements.txt
## Testing
pytest
""", encoding="utf-8")

    analyzer = ReadmeAnalyzer()
    analysis = analyzer.analyze_repository(str(tmp_path))

    assert analysis["has_existing_readme"] is True
    assert "Overview" in analysis["existing_sections"]
    assert "Installation" in analysis["existing_sections"]
    assert "Testing" in analysis["existing_sections"]
    assert "Environment Variables" in analysis["missing_sections"]
    assert analysis["completeness_score"] > 0


def test_readme_analyzer_sample_repo_manifest(sample_repo_path):
    """Verify manifest extraction on the sample-repo."""
    analyzer = ReadmeAnalyzer()
    analysis = analyzer.analyze_repository(sample_repo_path)
    manifest = analysis["detected_manifest"]

    assert "Python" in manifest["tech_stack"] or "Node.js" in manifest["tech_stack"]
    assert manifest["has_tests"] is True


def test_readme_generator_synthesis(sample_repo_path):
    """Verify ReadmeGenerator produces evidence-based README content."""
    generator = ReadmeGenerator(llm_client=MockLLMClient())
    result = generator.generate_or_update(sample_repo_path)

    assert "generated_readme" in result
    readme_content = result["generated_readme"]
    assert "## Overview" in readme_content
    assert "## Installation" in readme_content
    assert "## Testing" in readme_content


def test_readme_engine_realistic_project(tmp_path):
    """
    Verify README Engine on a realistic temporary project structure:
    project/
        app.py
        requirements.txt
        tests/
        README.md
    
    Verifies:
    - analyzer identifies actual project information
    - generator does not invent technologies
    - generator does not invent commands
    - generator does not invent environment variables
    - generator does not invent deployment info
    - preserves useful existing info
    """
    project_dir = tmp_path / "realistic_project"
    project_dir.mkdir()
    (project_dir / "app.py").write_text("print('CodeSentinel Service')", encoding="utf-8")
    (project_dir / "requirements.txt").write_text("fastapi>=0.100.0\nuvicorn\npytest\n", encoding="utf-8")
    tests_dir = project_dir / "tests"
    tests_dir.mkdir()
    (tests_dir / "test_api.py").write_text("def test_smoke(): pass", encoding="utf-8")
    (project_dir / "README.md").write_text("# Realistic App\n## Overview\nProduction-grade API service.\n", encoding="utf-8")

    analyzer = ReadmeAnalyzer()
    analysis = analyzer.analyze_repository(str(project_dir))

    # 1. Verify analyzer identifies actual project information
    assert analysis["has_existing_readme"] is True
    assert "Overview" in analysis["existing_sections"]
    manifest = analysis["detected_manifest"]
    assert "Python" in manifest["tech_stack"]
    assert "fastapi>=0.100.0" in manifest["dependencies"]
    assert "app.py" in manifest["entrypoints"]
    assert manifest["has_tests"] is True
    assert len(manifest["env_vars"]) == 0  # No .env created

    # 2. Verify generator does not invent technologies, commands, env vars, or deployment
    generator = ReadmeGenerator(llm_client=MockLLMClient())
    result = generator.generate_or_update(str(project_dir))

    generated_readme = result["generated_readme"]
    assert "fastapi>=0.100.0" in generated_readme
    assert "python app.py" in generated_readme
    assert "pytest" in generated_readme

    # Verify non-hallucination
    assert "Docker" not in generated_readme
    assert "Kubernetes" not in generated_readme
    assert "AWS" not in generated_readme
    assert "npm install" not in generated_readme
    assert "## Environment Variables" not in generated_readme
    assert "## Deployment" not in generated_readme

