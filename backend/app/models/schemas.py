"""
schemas.py — Shared Pydantic data contracts for CodeSentinel AI.

These models are the single source of truth for every request and response
shape across all route modules and future Member 2 / Member 3 integrations.

Rules:
- No business logic lives here — only data shapes and validation.
- All fields that are optional carry a sensible default or Optional[T].
- Enums are used wherever a field has a fixed set of valid values.
"""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# Enumerations
# ══════════════════════════════════════════════════════════════════════════════

class Severity(str, Enum):
    """Issue severity levels, ordered from most to least critical."""
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"
    INFO     = "info"


class Category(str, Enum):
    """High-level category of an issue finding."""
    BUG         = "bug"
    SECURITY    = "security"
    CODE_SMELL  = "code_smell"
    PERFORMANCE = "performance"
    STYLE       = "style"


class RiskLevel(str, Enum):
    """Overall risk level of a repository after analysis."""
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"


class EngineStatus(str, Enum):
    """Connection state of an external engine (analyzer, AI, GitHub)."""
    CONNECTED    = "connected"
    DISCONNECTED = "disconnected"
    ERROR        = "error"


# ══════════════════════════════════════════════════════════════════════════════
# Repository
# ══════════════════════════════════════════════════════════════════════════════

class RepositoryInfo(BaseModel):
    """Minimal metadata for a GitHub repository."""

    id:             int   = Field(..., description="GitHub repository ID")
    name:           str   = Field(..., description="Short repository name")
    full_name:      str   = Field(..., description="owner/repo format")
    private:        bool  = Field(..., description="Whether the repository is private")
    default_branch: str   = Field(..., description="Default branch name (e.g. 'main')")
    html_url:       str   = Field(..., description="GitHub web URL for this repository")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 123456789,
                "name": "my-repo",
                "full_name": "alice/my-repo",
                "private": False,
                "default_branch": "main",
                "html_url": "https://github.com/alice/my-repo",
            }
        }


# ══════════════════════════════════════════════════════════════════════════════
# Analysis request / response
# ══════════════════════════════════════════════════════════════════════════════

class AnalysisRequest(BaseModel):
    """
    Parameters required to trigger a code analysis run.

    Two modes are supported:

    **Mode A — Direct source-code analysis (available now)**
      Provide ``source_code`` (and optionally ``file_path`` / ``language``).
      The ai_engine analyzers run immediately without GitHub access.

    **Mode B — GitHub repository analysis (requires Member 3)**
      Provide only ``owner`` / ``repo`` / ``branch``.
      The endpoint returns HTTP 501 until Member 3 connects the GitHub fetch
      layer that downloads files and feeds them to Mode A.
    """

    owner:  str = Field(..., min_length=1, description="GitHub repository owner (user or org)")
    repo:   str = Field(..., min_length=1, description="GitHub repository name")
    branch: str = Field(default="main", min_length=1, description="Branch to analyse")

    # ── Mode A: direct analysis fields (optional) ──────────────────────────
    source_code: Optional[str] = Field(
        None,
        description="Raw source code to analyse directly (Mode A). "
                    "When provided the analysis runs immediately without GitHub access.",
    )
    file_path: str = Field(
        default="unknown.py",
        description="Relative file path label used in findings (Mode A).",
    )
    language: str = Field(
        default="python",
        description="Programming language of the source code (Mode A).",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "owner": "alice",
                "repo":  "my-repo",
                "branch": "main",
                "file_path": "src/auth/login.py",
                "language": "python",
                "source_code": "import os\npassword = 'secret123'\nquery = 'SELECT * FROM users WHERE id=' + user_id\n",
            }
        }


class IssueFinding(BaseModel):
    """A single issue discovered during code analysis."""

    file:           str            = Field(..., description="Relative path to the affected file")
    line:           int            = Field(..., ge=1, description="Line number of the issue")
    severity:       Severity       = Field(..., description="Issue severity level")
    category:       Category       = Field(..., description="Issue category")
    title:          str            = Field(..., description="Short issue title")
    description:    str            = Field(..., description="Detailed description of the issue")
    recommendation: str            = Field(..., description="Suggested fix or next action")
    # Extra optional fields forwarded by the frontend for pattern matching in the fix engine
    evidence:       Optional[str]  = Field(None, description="Raw evidence/code snippet from the analyzer")
    raw_category:   Optional[str]  = Field(None, description="Original free-text category from the analyzer")

    class Config:
        json_schema_extra = {
            "example": {
                "file":           "src/auth/login.py",
                "line":           42,
                "severity":       "high",
                "category":       "security",
                "title":          "SQL Injection Risk",
                "description":    "User input is concatenated directly into an SQL query.",
                "recommendation": "Use parameterised queries or an ORM.",
            }
        }


class AnalysisResponse(BaseModel):
    """Full analysis report for a source file or repository branch."""

    repository:       RepositoryInfo       = Field(..., description="Repository context")
    branch:           str                  = Field(..., description="Branch that was analysed")
    issues:           List[IssueFinding]   = Field(default_factory=list, description="List of issue findings")
    total_issues:     int                  = Field(..., ge=0, description="Total number of findings")
    risk_score:       int                  = Field(..., ge=0, le=100, description="Risk score 0–100 (RiskCalculator)")
    risk_level:       RiskLevel            = Field(..., description="Overall risk classification")
    release_decision: Optional[str]        = Field(None, description="DO_NOT_RELEASE | RELEASE_WITH_WARNINGS | RELEASE_READY")
    release_reason:   Optional[str]        = Field(None, description="Human-readable release decision rationale")
    analysis_mode:    str                  = Field(default="direct", description="'direct' or 'github'")

    class Config:
        json_schema_extra = {
            "example": {
                "repository": {
                    "id": 0,
                    "name": "my-repo",
                    "full_name": "alice/my-repo",
                    "private": False,
                    "default_branch": "main",
                    "html_url": "https://github.com/alice/my-repo",
                },
                "branch": "main",
                "issues": [],
                "total_issues": 0,
                "risk_score": 0,
                "risk_level": "low",
                "release_decision": "RELEASE_READY",
                "release_reason": "No issues detected.",
                "analysis_mode": "direct",
            }
        }


# ══════════════════════════════════════════════════════════════════════════════
# Fix request / response  (contract for Member 2 — AI Fix Engine)
# ══════════════════════════════════════════════════════════════════════════════

class FixRequest(BaseModel):
    """Request to generate an AI fix for a specific issue finding."""

    owner:   str         = Field(..., description="GitHub repository owner")
    repo:    str         = Field(..., description="GitHub repository name")
    branch:  str         = Field(default="main", description="Target branch")
    finding: IssueFinding = Field(..., description="The issue to fix")
    source_code: Optional[str] = Field(None, description="Optional raw source code for local analysis")


class FixResult(BaseModel):
    """A proposed AI-generated fix for a single issue."""

    finding:       IssueFinding   = Field(..., description="The original issue")
    patch:         Optional[str]  = Field(None, description="Unified diff patch, if available")
    explanation:   str            = Field(..., description="Human-readable explanation of the fix")
    confidence:    float          = Field(..., ge=0.0, le=1.0, description="AI confidence 0–1")


class ValidateFixRequest(BaseModel):
    """Request to validate a proposed fix before committing or applying."""

    fixed_code: Optional[str] = Field(None, description="The proposed fixed code to validate")
    patch: Optional[str] = Field(None, description="Unified diff patch or fallback fixed code")
    owner: Optional[str] = Field("local", description="Repository owner or 'local'")
    repo: Optional[str] = Field("uploaded-file", description="Repository name or 'uploaded-file'")
    branch: Optional[str] = Field("local", description="Branch name")
    source_code: Optional[str] = Field(None, description="Original source code if available")
    finding: Optional[dict] = Field(None, description="Issue finding dictionary")



# ══════════════════════════════════════════════════════════════════════════════
# GitHub workflow  (contract for Member 3 — GitHub Engine)
# ══════════════════════════════════════════════════════════════════════════════

class BranchRequest(BaseModel):
    """Request to create a new GitHub branch."""

    owner:       str = Field(..., description="Repository owner")
    repo:        str = Field(..., description="Repository name")
    branch_name: str = Field(..., description="Name for the new branch")
    from_branch: str = Field(default="main", description="Source branch to branch from")


class CommitRequest(BaseModel):
    """Request to commit a fix to a branch."""

    owner:       str = Field(..., description="Repository owner")
    repo:        str = Field(..., description="Repository name")
    branch:      str = Field(..., description="Target branch")
    file_path:   str = Field(..., description="Relative path of the file to update")
    new_content: str = Field(..., description="Full new file content")
    message:     str = Field(..., description="Commit message")


class PullRequestRequest(BaseModel):
    """Request to open a pull request."""

    owner:        str = Field(..., description="Repository owner")
    repo:         str = Field(..., description="Repository name")
    title:        str = Field(..., description="PR title")
    body:         str = Field(default="", description="PR description body")
    head_branch:  str = Field(..., description="Branch containing the changes")
    base_branch:  str = Field(default="main", description="Target branch for the PR")


# ══════════════════════════════════════════════════════════════════════════════
# Status / health
# ══════════════════════════════════════════════════════════════════════════════

class EngineStatusInfo(BaseModel):
    """Connection status of an individual engine."""

    name:    str          = Field(..., description="Engine name")
    status:  EngineStatus = Field(..., description="Current connection state")
    message: str          = Field(default="", description="Optional status message")


class ApiStatusResponse(BaseModel):
    """Overall API and engine connection status."""

    api:     str                    = Field(..., description="API service name")
    version: str                    = Field(..., description="API version")
    engines: List[EngineStatusInfo] = Field(..., description="Status of each connected engine")
