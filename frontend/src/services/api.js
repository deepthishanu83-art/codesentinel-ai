// API Service Layer Interface
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const api = {
  // ---------------------------------------------------------
  // GitHub User
  // ---------------------------------------------------------
  async getAuthenticatedUser() {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch user')
    return res.json()
  },

  // ---------------------------------------------------------
  // Repositories
  // ---------------------------------------------------------
  async getRepositories() {
    const res = await fetch(`${API_BASE}/api/repositories`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch repositories')
    const data = await res.json()
    return data.repositories ?? []
  },

  async getRepository(owner, repo) {
    const res = await fetch(`${API_BASE}/api/repositories/${owner}/${repo}`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch repository')
    return res.json()
  },

  async analyzeRepository(owner, repo, branch) {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        owner,
        repo,
        branch,
        file_path: "",
        language: "python"
      })
    })
    if (!res.ok) throw new Error('Analysis failed')
    return res.json()
  },

  async analyzeLocalFile(owner, repo, branch, file_path, language, source_code) {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner, repo, branch, file_path, language, source_code })
    })
    if (!res.ok) throw new Error('Analysis failed')
    return res.json()
  },

  // ---------------------------------------------------------
  // Issues & AI Fixes
  // ---------------------------------------------------------
  async generateFix(owner, repo, branch, finding) {
    const VALID_SEVERITY = new Set(['critical','high','medium','low','info'])
    const VALID_CATEGORY = new Set(['bug','security','code_smell','performance','style'])
    const sanitizedFinding = {
      file:           finding.file || 'unknown.py',
      line:           finding.line || 1,
      severity:       VALID_SEVERITY.has((finding.severity||'').toLowerCase())
                        ? (finding.severity||'').toLowerCase() : 'high',
      category:       VALID_CATEGORY.has((finding.category||'').toLowerCase())
                        ? (finding.category||'').toLowerCase() : 'bug',
      title:          finding.title || 'Issue detected',
      description:    finding.description || finding.message || 'Vulnerability detected',
      recommendation: finding.recommendation || 'Review and fix the affected code.',
      evidence:       finding.evidence || finding.code_snippet || null,
      raw_category:   finding.raw_category || finding.category || null,
    }
    const res = await fetch(`${API_BASE}/api/fixes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner, repo, branch, finding: sanitizedFinding })
    })
    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try {
        const errBody = await res.json()
        detail = errBody.detail || JSON.stringify(errBody)
      } catch (_) {}
      throw new Error(`Fix generation failed: ${detail}`)
    }
    return res.json()
  },

  async generateLocalFix(owner, repo, branch, finding, source_code) {
    // Sanitize finding to match backend IssueFinding enum constraints
    const VALID_SEVERITY = new Set(['critical','high','medium','low','info'])
    const VALID_CATEGORY = new Set(['bug','security','code_smell','performance','style'])
    const sanitizedFinding = {
      file:           finding.file || 'uploaded-file.py',
      line:           finding.line || 1,
      severity:       VALID_SEVERITY.has((finding.severity||'').toLowerCase())
                        ? (finding.severity||'').toLowerCase() : 'high',
      category:       VALID_CATEGORY.has((finding.category||'').toLowerCase())
                        ? (finding.category||'').toLowerCase() : 'bug',
      title:          finding.title || 'Issue detected',
      description:    finding.description || finding.message || 'Vulnerability detected',
      recommendation: finding.recommendation || 'Review and fix the affected code.',
      // Forward evidence and raw original category for fix-engine pattern matching
      evidence:       finding.evidence || finding.code_snippet || null,
      raw_category:   finding.category || null,
    }
    const res = await fetch(`${API_BASE}/api/fixes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner, repo, branch, finding: sanitizedFinding, source_code })
    })
    if (!res.ok) {
      let detail = `HTTP ${res.status}`
      try {
        const errBody = await res.json()
        detail = errBody.detail || JSON.stringify(errBody)
      } catch (_) {}
      throw new Error(`Fix generation failed: ${detail}`)
    }
    return res.json()
  },

  async validateFix(fixResult) {
    const res = await fetch(`${API_BASE}/api/fixes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(fixResult)
    })
    if (!res.ok) throw new Error('Failed to validate fix')
    return res.json()
  },

  // ---------------------------------------------------------
  // GitHub Workflow
  // ---------------------------------------------------------
  async createBranch(owner, repo, branch_name, from_branch) {
    const res = await fetch(`${API_BASE}/api/github/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner, repo, branch_name, from_branch })
    })
    if (!res.ok) throw new Error('Failed to create branch')
    return res.json()
  },

  async createCommit(owner, repo, branch, file_path, new_content, message) {
    const res = await fetch(`${API_BASE}/api/github/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner, repo, branch, file_path, new_content, message })
    })
    if (!res.ok) throw new Error('Failed to create commit')
    return res.json()
  },

  async createPullRequest(owner, repo, title, head_branch, base_branch, body) {
    const res = await fetch(`${API_BASE}/api/github/pull-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner, repo, title, head_branch, base_branch, body })
    })
    if (!res.ok) throw new Error('Failed to open pull request')
    return res.json()
  },
}
