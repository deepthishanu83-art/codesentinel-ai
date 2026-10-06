import { useState } from 'react'
import {
  ScanLine,
  Play,
  Loader2,
  GitFork,
  AlertOctagon,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'

function riskColor(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'text-red-400'
    case 'HIGH':     return 'text-orange-400'
    case 'MEDIUM':   return 'text-amber-400'
    case 'LOW':      return 'text-emerald-400'
    default:         return 'text-ink-secondary'
  }
}

export default function ScansPage() {
  const navigate = useNavigate()
  const { selectedRepo, analysisResult, setAnalysisResult } = useApp()
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState(null)

  const handleStartScan = async () => {
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
      navigate('/dashboard')
    } catch (err) {
      setScanError(err.message || 'Analysis failed.')
    } finally {
      setScanning(false)
    }
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border/50">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary tracking-tight flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-accent-cyan" />
            Repository Scans
          </h1>
          <p className="text-xs text-ink-tertiary mt-1">
            Repository: <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span>
          </p>
        </div>
        <button
          onClick={handleStartScan}
          disabled={scanning}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-teal hover:bg-accent-teal/90 disabled:opacity-60 text-surface-950 transition-all flex items-center gap-2"
        >
          {scanning ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
          ) : (
            <><Play className="w-4 h-4" /> Run Scan</>
          )}
        </button>
      </div>

      {scanError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Scan failed</p>
            <p className="text-xs mt-0.5 text-red-300/80">{scanError}</p>
          </div>
        </div>
      )}

      {scanning && (
        <div className="p-8 rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent-cyan" />
          <div className="text-center">
            <p className="font-semibold text-ink-primary">Analysing {selectedRepo.full_name}...</p>
            <p className="text-xs text-ink-tertiary mt-1">
              Running AI security analysis. This may take a minute.
            </p>
          </div>
        </div>
      )}

      {!scanning && analysisResult && (
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-border/50 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-ink-primary">Last Scan Results</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Total Issues</p>
              <p className="text-lg font-mono font-bold text-ink-primary">
                {analysisResult.total_issues ?? analysisResult.issues?.length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Risk Score</p>
              <p className={`text-lg font-mono font-bold ${riskColor(analysisResult.risk_level)}`}>
                {analysisResult.risk_score ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Risk Level</p>
              <p className={`text-sm font-mono font-bold ${riskColor(analysisResult.risk_level)}`}>
                {analysisResult.risk_level || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Decision</p>
              <p className={`text-sm font-mono font-bold ${
                analysisResult.release_decision === 'APPROVE' ? 'text-emerald-400' :
                analysisResult.release_decision === 'BLOCK' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {analysisResult.release_decision || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="pt-3 border-t border-surface-border/50 flex items-center justify-between">
            <p className="text-xs text-ink-tertiary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Branch: <span className="font-mono text-accent-cyan">{analysisResult.branch}</span>
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-accent-cyan hover:underline font-medium"
            >
              View Full Dashboard →
            </button>
          </div>
        </div>
      )}

      {!scanning && !analysisResult && !scanError && (
        <div className="text-center py-12 text-ink-tertiary border border-surface-border border-dashed rounded-2xl">
          <p className="text-sm">No recent scan results available for this repository.</p>
        </div>
      )}
    </div>
  )
}
