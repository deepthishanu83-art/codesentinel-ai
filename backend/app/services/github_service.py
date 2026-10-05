"""
github_service.py

All communication with the GitHub REST API lives here.

Rules enforced in this module:
- Access tokens are NEVER logged.
- Client secrets are NEVER sent outside of the token-exchange call.
- All API calls use the 'Authorization: Bearer <token>' header.
- Errors from GitHub are translated to meaningful FastAPI HTTPExceptions.
"""
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
    """
    Exchange a GitHub OAuth authorization code for an access token.

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
    """
    Fetch the authenticated user's GitHub repositories (both public and private
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
