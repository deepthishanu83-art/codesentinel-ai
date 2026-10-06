import { useState, useEffect } from 'react'
import {
  GitFork,
  Lock,
  Globe,
  Star,
  GitBranch,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertOctagon,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'
import { useNavigate } from 'react-router-dom'

export default function RepositoriesPage() {
  const { selectedRepo, setSelectedRepo } = useApp()
  const navigate = useNavigate()

  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchRepos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getRepositories()
      // Normalize: GitHub returns an array of repo objects
      setRepos(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepos()
  }, [])

  const handleSelect = (repo) => {
    setSelectedRepo({
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner?.login || repo.full_name.split('/')[0],
      repo: repo.name,
      default_branch: repo.default_branch || 'main',
      private: repo.private,
      html_url: repo.html_url,
      language: repo.language,
      description: repo.description,
      stargazers_count: repo.stargazers_count,
    })
    navigate('/dashboard')
  }

  const filtered = repos.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-ink-tertiary space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
        <p className="text-sm font-medium tracking-wide">Loading repositories…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-primary">Failed to load repositories</h2>
          <p className="text-sm text-ink-tertiary mt-1">{error}</p>
        </div>
        <button
          onClick={fetchRepos}
          className="px-4 py-2 mt-4 text-xs font-semibold rounded-lg bg-surface-card hover:bg-surface-border text-ink-primary border border-surface-border transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Repositories</h1>
          <p className="text-xs text-ink-tertiary mt-1">
            {repos.length} repositor{repos.length === 1 ? 'y' : 'ies'} connected via GitHub OAuth
          </p>
        </div>
        <button
          onClick={fetchRepos}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-card hover:bg-surface-border text-ink-secondary hover:text-ink-primary border border-surface-border transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Currently Selected Repo Banner */}
      {selectedRepo && (
        <div className="p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-accent-teal shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-primary font-mono truncate">
                {selectedRepo.full_name}
              </p>
              <p className="text-xs text-ink-tertiary">
                Selected for analysis · branch: <span className="font-mono text-accent-teal">{selectedRepo.default_branch}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-teal/20 hover:bg-accent-teal/30 text-accent-teal transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
        <input
          type="text"
          placeholder="Search repositories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-surface-card border border-surface-border text-ink-primary placeholder-ink-tertiary focus:outline-none focus:border-accent-cyan/50 transition-all"
        />
      </div>

      {/* Repository Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-tertiary">
          <GitFork className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No repositories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((repo) => {
            const isSelected = selectedRepo?.full_name === repo.full_name
            return (
              <div
                key={repo.id || repo.full_name}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-3 cursor-pointer group ${
                  isSelected
                    ? 'bg-accent-teal/10 border-accent-teal/40'
                    : 'bg-surface-card border-surface-border hover:border-accent-cyan/30'
                }`}
                onClick={() => handleSelect(repo)}
              >
                {/* Repo header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 text-ink-tertiary">
                      {repo.private ? (
                        <Lock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-emerald-400" />
                      )}
                    </span>
                    <span className="font-mono text-sm font-semibold text-ink-primary truncate">
                      {repo.name}
                    </span>
                    {isSelected && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-accent-teal/20 text-accent-teal">
                        Selected
                      </span>
                    )}
                  </div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-ink-tertiary hover:text-accent-cyan transition-colors"
                    aria-label="Open on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Description */}
                {repo.description && (
                  <p className="text-xs text-ink-tertiary leading-relaxed line-clamp-2">
                    {repo.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 mt-auto flex-wrap text-xs text-ink-tertiary">
                  {repo.language && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-border text-ink-secondary font-mono">
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {repo.default_branch || 'main'}
                  </span>
                  {repo.stargazers_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {repo.stargazers_count}
                    </span>
                  )}
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    repo.private
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {repo.private ? 'Private' : 'Public'}
                  </span>
                </div>

                {/* Analyze CTA */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelect(repo) }}
                  className={`w-full mt-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isSelected
                      ? 'bg-accent-teal text-surface-950'
                      : 'bg-surface-border hover:bg-accent-cyan/20 hover:text-accent-cyan text-ink-secondary'
                  }`}
                >
                  {isSelected ? 'Selected — Go to Dashboard' : 'Select & Analyse'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
