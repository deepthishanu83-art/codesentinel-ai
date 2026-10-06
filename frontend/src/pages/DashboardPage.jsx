import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  GitFork,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Activity,
  RefreshCw,
  Loader2,
  AlertOctagon,
  Play,
  GitBranch,
  Filter,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'

// ── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(severity) {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'HIGH':     return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    case 'MEDIUM':   return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'LOW':      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    default:         return 'bg-surface-border text-ink-tertiary border-surface-border'
  }
}

function riskColor(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'text-red-400'
    case 'HIGH':     return 'text-orange-400'
    case 'MEDIUM':   return 'text-amber-400'
    case 'LOW':      return 'text-emerald-400'
    default:         return 'text-ink-secondary'
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    selectedRepo,
    analysisResult, setAnalysisResult,
    setSelectedFinding,
  } = useApp()

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState(null)

  // ── Start scan ──────────────────────────────────────────────────────────────
  const startScan = async () => {
    if (!selectedRepo) return
    setScanning(true)
    setScanError(null)
    try {
      const result = await api.analyzeRepository(
        selectedRepo.owner,
        selectedRepo.repo,
        selectedRepo.default_branch
      )
      setAnalysisResult(result)
    } catch (err) {
      setScanError(err.message || 'Analysis failed.')
    } finally {
      setScanning(false)
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const findings = analysisResult?.issues || []
  const totalIssues = analysisResult?.total_issues ?? analysisResult?.issues?.length ?? null
  const riskScore = analysisResult?.risk_score
  const riskLevel = analysisResult?.risk_level
  const releaseDecision = analysisResult?.release_decision
  const releaseReason = analysisResult?.release_reason
  const analysisMode = analysisResult?.analysis_mode

  // ── No repo selected state ──────────────────────────────────────────────────
  if (!selectedRepo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 animate-fade-in">
        <div className="p-5 rounded-full bg-surface-card border border-surface-border text-ink-tertiary">
          <GitFork className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-primary">No repository selected</h2>
          <p className="text-sm text-ink-tertiary mt-1">
            Choose a repository from the Repositories page to start scanning.
          </p>
        </div>
        <button
          onClick={() => navigate('/repositories')}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal/20 hover:bg-accent-teal/30 text-accent-teal transition-all flex items-center gap-2"
        >
          <GitFork className="w-4 h-4" />
          Browse Repositories
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink-primary tracking-tight font-mono">
              {selectedRepo.full_name}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Repository
            </span>
          </div>
          <p className="text-xs text-ink-tertiary mt-1.5 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-mono text-ink-secondary">{selectedRepo.default_branch}</span>
            {analysisMode && (
              <>
                <span>•</span>
                <span>Mode: <span className="font-mono text-accent-cyan">{analysisMode}</span></span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/repositories')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-card hover:bg-surface-border text-ink-secondary hover:text-ink-primary border border-surface-border transition-all flex items-center gap-1.5"
          >
            <GitFork className="w-3.5 h-3.5" />
            Change Repo
          </button>
          <button
            onClick={startScan}
            disabled={scanning}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-teal/20 hover:bg-accent-teal/30 disabled:opacity-60 text-accent-teal border border-accent-teal/30 transition-all flex items-center gap-1.5"
          >
            {scanning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Start Scan</>
            )}
          </button>
        </div>
      </div>

      {/* ── Scan error ─────────────────────────────────────────────────────── */}
      {scanError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Scan failed</p>
            <p className="text-xs mt-0.5 text-red-300/80">{scanError}</p>
          </div>
        </div>
      )}

      {/* ── Scanning progress ──────────────────────────────────────────────── */}
      {scanning && (
        <div className="p-8 rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent-cyan" />
          <div className="text-center">
            <p className="font-semibold text-ink-primary">Analysing {selectedRepo.full_name}…</p>
            <p className="text-xs text-ink-tertiary mt-1">
              Fetching repository files and running AI security analysis. This may take 30-60 seconds.
            </p>
          </div>
        </div>
      )}

      {/* ── No scan yet ────────────────────────────────────────────────────── */}
      {!scanning && !analysisResult && !scanError && (
        <div className="p-10 rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-accent-teal">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="font-semibold text-ink-primary text-lg">Ready to scan</p>
            <p className="text-xs text-ink-tertiary mt-1 max-w-sm">
              Click <strong>Start Scan</strong> to run the AI-powered security, bug, and code quality analysis on{' '}
              <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span>.
            </p>
          </div>
          <button
            onClick={startScan}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal text-surface-950 hover:bg-accent-teal/90 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Scan
          </button>
        </div>
      )}

      {/* ── Analysis Results ───────────────────────────────────────────────── */}
      {!scanning && analysisResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Issues */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="text-xs font-medium text-ink-tertiary mb-1">Total Issues</div>
              <div className="text-2xl font-bold text-ink-primary font-mono">
                {totalIssues ?? 'N/A'}
              </div>
            </div>

            {/* Risk Score */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="text-xs font-medium text-ink-tertiary mb-1">Risk Score</div>
              <div className={`text-2xl font-bold font-mono ${riskColor(riskLevel)}`}>
                {riskScore !== undefined && riskScore !== null ? `${riskScore}` : 'N/A'}
              </div>
            </div>

            {/* Risk Level */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="text-xs font-medium text-ink-tertiary mb-1">Risk Level</div>
              <div className={`text-xl font-bold font-mono ${riskColor(riskLevel)}`}>
                {riskLevel || 'N/A'}
              </div>
            </div>

            {/* Release Decision */}
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <div className="text-xs font-medium text-ink-tertiary mb-1">Release Decision</div>
              <div className={`text-base font-bold font-mono ${
                releaseDecision === 'APPROVE' ? 'text-emerald-400' :
                releaseDecision === 'BLOCK' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {releaseDecision || 'N/A'}
              </div>
              {releaseReason && (
                <p className="text-[10px] text-ink-tertiary mt-1 line-clamp-2">{releaseReason}</p>
              )}
            </div>
          </div>

          {/* Findings Table */}
          <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-surface-border/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink-primary tracking-wide">
                  Security & Code Findings
                </h3>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  {findings.length} issue{findings.length === 1 ? '' : 's'} found in{' '}
                  <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => navigate('/issues')}
                className="text-xs text-accent-cyan hover:underline font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-border/40 bg-surface-base/40 text-ink-tertiary font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Severity</th>
                    <th className="py-3 px-4 font-medium">File</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/30 text-ink-secondary">
                  {findings.length > 0 ? (
                    findings.slice(0, 10).map((f, idx) => (
                      <tr key={idx} className="hover:bg-surface-border/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-ink-primary">{f.title || f.description || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-ink-tertiary font-mono">{f.category || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${severityColor(f.severity)}`}>
                            {f.severity || 'INFO'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-ink-tertiary">
                          {f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => { setSelectedFinding(f); navigate('/fixes') }}
                            className="px-2.5 py-1 text-[11px] font-medium rounded bg-surface-border hover:bg-surface-border/80 hover:text-accent-cyan text-ink-primary transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            Fix
                            <ExternalLink className="w-3 h-3 text-ink-tertiary" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-ink-tertiary">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                        No issues found — repository looks clean!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
