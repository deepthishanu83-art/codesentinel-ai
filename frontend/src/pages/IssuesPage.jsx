import { useState } from 'react'
import {
  TriangleAlert,
  AlertOctagon,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  Filter,
  GitFork,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

function severityConfig(severity) {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL':
      return {
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
      }
    case 'HIGH':
      return {
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        icon: <ShieldAlert className="w-4 h-4 text-orange-400" />,
      }
    case 'MEDIUM':
      return {
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: <TriangleAlert className="w-4 h-4 text-amber-400" />,
      }
    case 'LOW':
      return {
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: <Info className="w-4 h-4 text-blue-400" />,
      }
    default:
      return {
        color: 'bg-surface-border text-ink-tertiary border-surface-border',
        icon: <Info className="w-4 h-4 text-ink-tertiary" />,
      }
  }
}

function FindingCard({ finding, onSelectFix }) {
  const [expanded, setExpanded] = useState(false)
  const { color, icon } = severityConfig(finding.severity)

  return (
    <div className="rounded-xl bg-surface-card border border-surface-border hover:border-surface-border/80 transition-all overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-primary text-sm truncate">
              {finding.title || finding.description || 'Unnamed Finding'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${color}`}>
              {finding.severity || 'INFO'}
            </span>
            {finding.category && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-border text-ink-tertiary shrink-0">
                {finding.category}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-tertiary mt-1 font-mono">
            {finding.file && <span className="text-accent-cyan">{finding.file}</span>}
            {finding.file && finding.line ? `:${finding.line}` : ''}
          </p>
        </div>
        <span className="text-ink-tertiary shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-surface-border/50 pt-3">
          {finding.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1">Description</p>
              <p className="text-xs text-ink-secondary leading-relaxed">{finding.description}</p>
            </div>
          )}
          {finding.recommendation && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1">Recommendation</p>
              <p className="text-xs text-ink-secondary leading-relaxed">{finding.recommendation}</p>
            </div>
          )}
          <button
            onClick={() => onSelectFix(finding)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-violet/20 hover:bg-accent-violet/30 text-accent-violet transition-all flex items-center gap-2"
          >
            <Wrench className="w-3.5 h-3.5" />
            Generate AI Fix
          </button>
        </div>
      )}
    </div>
  )
}

export default function IssuesPage() {
  const navigate = useNavigate()
  const { analysisResult, selectedRepo, setSelectedFinding } = useApp()
  const [filterSeverity, setFilterSeverity] = useState('ALL')

  const handleSelectFix = (finding) => {
    setSelectedFinding(finding)
    navigate('/fixes')
  }

  if (!selectedRepo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <GitFork className="w-12 h-12 text-ink-tertiary opacity-30" />
        <h2 className="text-lg font-semibold text-ink-primary">No repository selected</h2>
        <p className="text-sm text-ink-tertiary">Select a repository first, then run a scan.</p>
        <button
          onClick={() => navigate('/repositories')}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal/20 hover:bg-accent-teal/30 text-accent-teal transition-all"
        >
          Go to Repositories
        </button>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <TriangleAlert className="w-12 h-12 text-ink-tertiary opacity-30" />
        <h2 className="text-lg font-semibold text-ink-primary">No scan results yet</h2>
        <p className="text-sm text-ink-tertiary">
          Run a scan on <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span> from the Dashboard.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal/20 hover:bg-accent-teal/30 text-accent-teal transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  const findings = analysisResult?.issues || []
  const filtered =
    filterSeverity === 'ALL'
      ? findings
      : findings.filter((f) => (f.severity || '').toUpperCase() === filterSeverity)

  const countBySeverity = SEVERITY_ORDER.reduce((acc, sev) => {
    acc[sev] = findings.filter((f) => (f.severity || '').toUpperCase() === sev).length
    return acc
  }, {})

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-surface-border/50">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Issues</h1>
        <p className="text-xs text-ink-tertiary mt-1">
          {findings.length} finding{findings.length === 1 ? '' : 's'} from last scan of{' '}
          <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span>
        </p>
      </div>

      {/* Severity Summary */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterSeverity('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filterSeverity === 'ALL'
              ? 'bg-ink-primary text-surface-950'
              : 'bg-surface-card border border-surface-border text-ink-secondary hover:text-ink-primary'
          }`}
        >
          <Filter className="w-3 h-3" />
          All ({findings.length})
        </button>
        {SEVERITY_ORDER.map((sev) =>
          countBySeverity[sev] > 0 ? (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterSeverity === sev
                  ? severityConfig(sev).color
                  : 'bg-surface-card border-surface-border text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {sev} ({countBySeverity[sev]})
            </button>
          ) : null
        )}
      </div>

      {/* Findings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-ink-tertiary">
          <p className="text-sm">No issues match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f, idx) => (
            <FindingCard key={idx} finding={f} onSelectFix={handleSelectFix} />
          ))}
        </div>
      )}
    </div>
  )
}
