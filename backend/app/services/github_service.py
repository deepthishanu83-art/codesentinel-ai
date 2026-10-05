"""github_service.py

All communication with the GitHub REST API lives here.

Rules enforced in this module:
- Access tokens are NEVER logged.
- Client secrets are NEVER sent outside of the token-exchange call.
- All API calls use the 'Authorization: Bearer <token>' header.
- Errors from GitHub are translated to meaningful FastAPI HTTPExceptions.
"""

import os
import httpx
from fastapi import HTTPException, status

from app.config import (
    GITHUB_API_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_TOKEN_URL,
)

# ── Shared HTTP headers for GitHub API v3 ─────────────────────────────────────
_GITHUB_API_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
_HTTP_TIMEOUT = 15.0  # seconds


def _auth_headers(token: str) -> dict:
    """Return authorization headers for an authenticated GitHub API request."""
    return {**_GITHUB_API_HEADERS, "Authorization": f"Bearer {token}"}


# ── OAuth token exchange ───────────────────────────────────────────────────────
async def exchange_code_for_token(code: str) -> str:
    """Exchange a GitHub OAuth authorization code for an access token.

    The client secret is used here and NOWHERE else.
    The returned token is returned to the caller but never logged.
    """
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub did not return a successful response during token exchange.",
        )

    data = response.json()
    # GitHub returns errors as JSON fields, not HTTP status codes
    if "error" in data:
        error_description = data.get("error_description", data["error"])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub OAuth error: {error_description}",
        )

    token = data.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub did not return an access token. The authorization code may have expired.",
        )

    return token


# ── Authenticated user ─────────────────────────────────────────────────────────
async def get_authenticated_user(token: str) -> dict:
    """Fetch the currently authenticated GitHub user's public profile."""
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_URL}/user",
            headers=_auth_headers(token),
        )

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="GitHub token is invalid or has been revoked.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned {response.status_code} when fetching user profile.",
        )

    data = response.json()
    return {
        "login": data.get("login"),
        "name": data.get("name"),
        "email": data.get("email"),
        "avatar_url": data.get("avatar_url"),
        "html_url": data.get("html_url"),
        "public_repos": data.get("public_repos"),
        "total_private_repos": data.get("total_private_repos"),
    }


# ── Repositories ───────────────────────────────────────────────────────────────
async def get_user_repositories(
    token: str,
    per_page: int = 30,
    page: int = 1,
) -> list[dict]:
    """Fetch the authenticated user's GitHub repositories (both public and private

    that the token has access to), sorted by most recently updated.
    """
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_URL}/user/repos",
            headers=_auth_headers(token),
            params={
                "sort": "updated",
                "direction": "desc",
                "per_page": per_page,
                "page": page,
                "affiliation": "owner,collaborator,organization_member",
            },
        )

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in via /auth/github/login",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned {response.status_code} when listing repositories.",
        )

    return [_map_repo(r) for r in response.json()]


async def get_repository(token: str, owner: str, repo: str) -> dict:
    """Fetch metadata for a specific GitHub repository by owner/repo."""
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}",
            headers=_auth_headers(token),
        )

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in via /auth/github/login",
        )

    if response.status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to access {owner}/{repo}.",
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository '{owner}/{repo}' was not found on GitHub.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned {response.status_code} for {owner}/{repo}.",
        )

    r = response.json()
    return {
        **_map_repo(r),
        # Additional fields for the detail view
        "forks_count": r.get("forks_count", 0),
        "open_issues_count": r.get("open_issues_count", 0),
        "watchers_count": r.get("watchers_count", 0),
        "size": r.get("size"),
        "clone_url": r.get("clone_url"),
        "ssh_url": r.get("ssh_url"),
        "topics": r.get("topics", []),
        "license": r["license"]["name"] if r.get("license") else None,
        "created_at": r.get("created_at"),
        "pushed_at": r.get("pushed_at"),
    }


# ── Internal helpers ───────────────────────────────────────────────────────────
def _map_repo(r: dict) -> dict:
    """Extract the standard repository fields returned by all repo endpoints."""
    return {
        "id": r["id"],
        "name": r["name"],
        "full_name": r["full_name"],
        "private": r["private"],
        "default_branch": r.get("default_branch", "main"),
        "html_url": r["html_url"],
        "description": r.get("description"),
        "language": r.get("language"),
        "stargazers_count": r.get("stargazers_count", 0),
        "updated_at": r.get("updated_at"),
    }


# ── Files and Trees ────────────────────────────────────────────────────────────
async def get_repository_tree(token: str, owner: str, repo: str, branch: str = "HEAD") -> list:
    """Fetch the complete recursive file tree for a repository."""
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
            headers=_auth_headers(token),
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned {response.status_code} when fetching tree for {owner}/{repo}.",
        )

    return response.json().get("tree", [])


async def get_file_content(token: str, owner: str, repo: str, path: str) -> str:
    """Fetch the decoded text content of a file from GitHub."""
    import base64

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/contents/{path}",
            headers=_auth_headers(token),
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {path} not found in {owner}/{repo}.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub API returned {response.status_code} when fetching file {path}.",
        )

    data = response.json()
    if data.get("encoding") == "base64":
        try:
            return base64.b64decode(data.get("content", "")).decode("utf-8")
        except UnicodeDecodeError:
            raise ValueError(f"File '{path}' appears to be binary and cannot be analyzed as text.")

    return data.get("content", "")


# ── Bulk Source Fetching (Mode B Analysis) ─────────────────────────────────────
SUPPORTED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx"}
IGNORED_FOLDERS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    "coverage",
    ".github",
}
IGNORED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
    ".mp4",
    ".mp3",
    ".wav",
    ".zip",
    ".tar",
    ".gz",
    ".rar",
    ".pdf",
    ".doc",
    ".docx",
    ".lock",
    ".map",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".pyc",
    ".pyo",
}
MAX_FILE_SIZE_BYTES = 500_000


def _is_ignored_path(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    for part in parts[:-1]:
        if part in IGNORED_FOLDERS:
            return True
    return False


def _detect_language(path: str) -> str | None:
    _, ext = os.path.splitext(path)
    ext = ext.lower()
    mapping = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
    }
    return mapping.get(ext)


async def fetch_all_source_files(token: str, owner: str, repo: str, branch: str = "HEAD") -> list[dict]:
    """Fetch the content of all analyzable source files in the repository."""
    tree = await get_repository_tree(token, owner, repo, branch)
    files_to_fetch = []
    for item in tree:
        if item.get("type") != "blob":
            continue
        path = item.get("path", "")
        _, ext = os.path.splitext(path)
        ext = ext.lower()
        if _is_ignored_path(path) or ext in IGNORED_EXTENSIONS or ext not in SUPPORTED_EXTENSIONS:
            continue
        size = item.get("size", 0)
        if size > MAX_FILE_SIZE_BYTES:
            continue
        files_to_fetch.append({"path": path, "language": _detect_language(path)})

    results = []
    for meta in files_to_fetch:
        try:
            content = await get_file_content(token, owner, repo, meta["path"])
            results.append({
                "path": meta["path"],
                "language": meta["language"],
                "content": content,
            })
        except (ValueError, RuntimeError, HTTPException):
            continue
    return results


# ── Branches ───────────────────────────────────────────────────────────────────
async def get_branch(token: str, owner: str, repo: str, branch: str) -> dict:
    """Get branch info (e.g. to find the SHA of the branch)."""
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/git/ref/heads/{branch}",
            headers=_auth_headers(token),
        )

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Branch {branch} not found.")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Error fetching branch {branch}.")

    return response.json()


async def create_branch(token: str, owner: str, repo: str, branch_name: str, from_branch: str) -> dict:
    """Create a new branch from an existing branch."""
    base_ref = await get_branch(token, owner, repo, from_branch)
    sha = base_ref["object"]["sha"]

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/git/refs",
            headers=_auth_headers(token),
            json={
                "ref": f"refs/heads/{branch_name}",
                "sha": sha,
            },
        )

    if response.status_code == 422:
        raise HTTPException(status_code=400, detail=f"Branch {branch_name} already exists or is invalid.")

    if response.status_code != 201:
        raise HTTPException(status_code=502, detail=f"Error creating branch {branch_name}.")

    return {
        "status": "success",
        "branch": branch_name,
        "sha": response.json()["object"]["sha"],
    }


# ── Commits ────────────────────────────────────────────────────────────────────
async def create_commit(
    token: str,
    owner: str,
    repo: str,
    branch: str,
    file_path: str,
    content: str,
    message: str,
) -> dict:
    """Commit a file change to a specific branch."""
    import base64

    sha = None
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        file_resp = await client.get(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/contents/{file_path}?ref={branch}",
            headers=_auth_headers(token),
        )
        if file_resp.status_code == 200:
            sha = file_resp.json().get("sha")

    content_b64 = base64.b64encode(content.encode("utf-8")).decode("utf-8")
    payload = {
        "message": message,
        "content": content_b64,
        "branch": branch,
    }
    if sha:
        payload["sha"] = sha

    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        put_resp = await client.put(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/contents/{file_path}",
            headers=_auth_headers(token),
            json=payload,
        )

    if put_resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail=f"Failed to commit file {file_path}. GitHub API returned {put_resp.status_code}",
        )

    return {
        "status": "success",
        "file_path": file_path,
        "commit_sha": put_resp.json()["commit"]["sha"],
    }


# ── Pull Requests ──────────────────────────────────────────────────────────────
async def create_pull_request(
    token: str,
    owner: str,
    repo: str,
    title: str,
    head_branch: str,
    base_branch: str,
    body: str = "",
) -> dict:
    """Create a pull request."""
    async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
        response = await client.post(
            f"{GITHUB_API_URL}/repos/{owner}/{repo}/pulls",
            headers=_auth_headers(token),
            json={
                "title": title,
                "head": head_branch,
                "base": base_branch,
                "body": body,
            },
        )

    if response.status_code == 422:
        raise HTTPException(
            status_code=400,
            detail="Pull request creation failed (maybe it already exists or there are no differences).",
        )

    if response.status_code != 201:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to create pull request. GitHub API returned {response.status_code}",
        )

    data = response.json()
    return {
        "status": "success",
        "pr_number": data["number"],
        "pr_url": data["html_url"],
        "title": data["title"],
    }