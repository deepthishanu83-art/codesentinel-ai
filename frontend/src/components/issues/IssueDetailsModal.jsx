import { useState, useEffect, useRef } from 'react'
import {
  X,
  CheckCircle2,
  ShieldAlert,
  GitPullRequest,
  Code2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export default function IssueDetailsModal({ issue, isOpen, onClose }) {
  const [isApplying, setIsApplying] = useState(false)
  const [prCreated, setPrCreated] = useState(false)
  const closeButtonRef = useRef(null)

  // Auto-focus close button on open for keyboard trapping
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Escape key dismisses modal
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen || !issue) return null

  const handleApplyFix = () => {
    setIsApplying(true)
    setTimeout(() => {
      setIsApplying(false)
      setPrCreated(true)
    }, 1200)
  }

  const modalTitleId = `issue-modal-title-${issue.id}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/80 backdrop-blur-md"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 text-ink-primary animate-fade-in-up">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-surface-border/60 flex items-start justify-between bg-surface-card/80 backdrop-blur shrink-0">
          <div className="flex items-start gap-3 min-w-0 pr-4">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h2
                  id={modalTitleId}
                  className="text-lg font-bold text-ink-primary tracking-tight"
                >
                  {issue.title}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded border shrink-0 ${issue.severityColor}`}>
                  {issue.severity}
                </span>
              </div>
              <p className="text-xs text-ink-tertiary font-mono">
                <span className="text-ink-muted">File:</span>{' '}
                <span className="text-accent-cyan">{issue.file}</span>
                <span className="text-ink-muted ml-2">Line:</span>{' '}
                <span className="text-accent-cyan">{issue.line}</span>
                <span className="text-ink-muted ml-2">ID:</span>{' '}
                <span className="text-ink-secondary">{issue.id}</span>
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close issue details"
            className="p-1.5 rounded-lg bg-surface-base hover:bg-surface-border text-ink-tertiary hover:text-ink-primary transition-all shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-ink-secondary flex-1">

          {/* PR success banner */}
          {prCreated && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Pull Request Created Successfully!</p>
                  <p className="text-xs text-emerald-300/80 truncate">PR #104: "Fix SQL injection in auth pipeline" pushed to remote.</p>
                </div>
              </div>
              <button className="font-mono text-xs underline shrink-0 hover:text-emerald-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded px-1">
                View PR #104
              </button>
            </div>
          )}

          {/* 1. Why this is a problem */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
              1. Why This Is A Problem
            </h3>
            <div className="p-3.5 rounded-xl bg-surface-base/60 border border-surface-border/70 text-ink-secondary leading-relaxed">
              {issue.whyProblem}
            </div>
          </div>

          {/* 2 & 3. Vulnerable code / AI fix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" aria-hidden="true" />
                2. Vulnerable Code
              </h3>
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 font-mono text-[11px] leading-relaxed overflow-x-auto text-red-200">
                <pre>{issue.vulnerableCode}</pre>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                3. AI Recommended Fix
              </h3>
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-200">
                <pre>{issue.aiRecommendedFix}</pre>
              </div>
            </div>
          </div>

          {/* 4. Code diff */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-accent-cyan" aria-hidden="true" />
              4. Code Diff
            </h3>
            <div className="p-3 rounded-xl bg-surface-base border border-surface-border font-mono text-[11px] overflow-x-auto">
              {issue.diff.map((line, idx) => (
                <div
                  key={idx}
                  className={`py-0.5 px-2 rounded ${
                    line.type === 'removed'
                      ? 'bg-red-500/10 text-red-400'
                      : line.type === 'added'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-ink-tertiary'
                  }`}
                >
                  <span className="inline-block w-4 select-none" aria-hidden="true">
                    {line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' '}
                  </span>
                  {line.line}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Validation */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-tertiary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-teal" aria-hidden="true" />
              5. Validation & Automated Checks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                issue.validation.syntaxCheck,
                issue.validation.tests,
                issue.validation.securityScan,
              ].map((check) => (
                <div
                  key={check.label}
                  className="p-3 rounded-xl bg-surface-base/80 border border-emerald-500/20 flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-emerald-300 font-medium">{check.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer actions ───────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-surface-border/60 bg-surface-card/80 backdrop-blur flex items-center justify-between shrink-0 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-base hover:bg-surface-border text-ink-secondary hover:text-ink-primary border border-surface-border transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            Dismiss
          </button>

          <button
            onClick={handleApplyFix}
            disabled={isApplying || prCreated}
            aria-busy={isApplying}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 text-white shadow-lg shadow-accent-violet/25 transition-all flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            {isApplying ? (
              <span>Applying & Generating PR...</span>
            ) : prCreated ? (
              <span>Fix Applied ✓</span>
            ) : (
              <>
                <GitPullRequest className="w-4 h-4" aria-hidden="true" />
                <span>Apply Fix & Create PR</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
