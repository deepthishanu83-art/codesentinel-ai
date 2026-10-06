import { useState, useEffect } from 'react'
import {
  Wrench,
  CheckCircle2,
  AlertOctagon,
  Loader2,
  GitFork,
  TriangleAlert,
  Shield,
  ShieldCheck,
  Code2,
  ArrowRight,
  GitBranch,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useApp } from '../contexts/AppContext'

export default function FixesPage() {
  const navigate = useNavigate()
  const {
    selectedRepo,
    analysisResult,
    selectedFinding, setSelectedFinding,
    generatedFix, setGeneratedFix,
    validatedFix, setValidatedFix,
  } = useApp()

  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [validating, setValidating] = useState(false)
  const [valError, setValError] = useState(null)
  const [editedFixedCode, setEditedFixedCode] = useState("")

  // When the finding changes, clear old fix results
  useEffect(() => {
    setGeneratedFix(null)
    setValidatedFix(null)
    setGenError(null)
    setValError(null)
    setEditedFixedCode("")
  }, [selectedFinding])

  const handleGenerate = async () => {
    if (!selectedRepo || !selectedFinding) return
    setGenerating(true)
    setGenError(null)
    setGeneratedFix(null)
    setValidatedFix(null)
    try {
      const sourceCode = analysisResult?.source_code || selectedFinding?.source_code || null
      const isLocal = selectedRepo?.owner === 'local' || Boolean(sourceCode)
      const result = isLocal
        ? await api.generateLocalFix(
            selectedRepo?.owner || 'local',
            selectedRepo?.repo || 'local',
            selectedRepo?.default_branch || 'main',
            selectedFinding,
            sourceCode
          )
        : await api.generateFix(
            selectedRepo.owner,
            selectedRepo.repo,
            selectedRepo.default_branch,
            selectedFinding
          )
      const fix = result.fix || result
      setGeneratedFix(fix)
      setEditedFixedCode(fix.fixed_code || fix.patch || fix.suggested_fix || "")
    } catch (err) {
      setGenError(err.message || 'Failed to generate fix.')
    } finally {
      setGenerating(false)
    }
  }

  const handleValidate = async () => {
    if (!generatedFix) return
    setValidating(true)
    setValError(null)
    setValidatedFix(null)
    try {
      const payloadToValidate = { ...generatedFix, patch: editedFixedCode, fixed_code: editedFixedCode }
      const result = await api.validateFix(payloadToValidate)
      setValidatedFix(result)
    } catch (err) {
      setValError(err.message || 'Failed to validate fix.')
    } finally {
      setValidating(false)
    }
  }

  // Guard states
  if (!selectedRepo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <GitFork className="w-12 h-12 text-ink-tertiary opacity-30" />
        <h2 className="text-lg font-semibold text-ink-primary">No repository selected</h2>
        <button onClick={() => navigate('/repositories')} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal/20 text-accent-teal transition-all">
          Go to Repositories
        </button>
      </div>
    )
  }

  if (!selectedFinding && !analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <Wrench className="w-12 h-12 text-ink-tertiary opacity-30" />
        <h2 className="text-lg font-semibold text-ink-primary">No finding selected</h2>
        <p className="text-sm text-ink-tertiary">Run a scan first, then select a finding to fix.</p>
        <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal/20 text-accent-teal transition-all">
          Go to Dashboard
        </button>
      </div>
    )
  }

  const findings = analysisResult?.issues || []

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-surface-border/50">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight">AI Fix Generator</h1>
        <p className="text-xs text-ink-tertiary mt-1">
          Repository: <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left: Finding Selector ───────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-tertiary">Select Finding</h2>
          {findings.length === 0 && !selectedFinding ? (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-xs text-ink-tertiary text-center">
              No findings available. Run a scan first.
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {(findings.length > 0 ? findings : [selectedFinding]).filter(Boolean).map((f, idx) => {
                const isSelected = selectedFinding === f ||
                  (selectedFinding?.title === f?.title && selectedFinding?.file === f?.file && selectedFinding?.line === f?.line)
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFinding(f)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent-violet/10 border-accent-violet/40'
                        : 'bg-surface-card border-surface-border hover:border-surface-border/80'
                    }`}
                  >
                    <p className="text-xs font-semibold text-ink-primary truncate">
                      {f.title || f.description || 'Finding'}
                    </p>
                    <p className="text-[10px] font-mono text-ink-tertiary mt-0.5 truncate">
                      {f.file}{f.line ? `:${f.line}` : ''}
                    </p>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      (f.severity || '').toUpperCase() === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      (f.severity || '').toUpperCase() === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      (f.severity || '').toUpperCase() === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {f.severity || 'INFO'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Right: Fix Panel ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          {selectedFinding && (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <h3 className="text-sm font-semibold text-ink-primary">
                {selectedFinding.title || selectedFinding.description}
              </h3>
              {selectedFinding.description && selectedFinding.title && (
                <p className="text-xs text-ink-tertiary mt-1 leading-relaxed">{selectedFinding.description}</p>
              )}
              {selectedFinding.recommendation && (
                <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                  <strong>Recommendation:</strong> {selectedFinding.recommendation}
                </p>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 px-5 py-2.5 text-xs font-semibold rounded-xl bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-60 text-white shadow-lg shadow-accent-violet/25 transition-all flex items-center gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating AI Fix…</>
                ) : (
                  <><Wrench className="w-4 h-4" /> Generate AI Fix</>
                )}
              </button>
            </div>
          )}

          {genError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Generation failed</p>
                <p className="text-xs mt-0.5 text-red-300/80">{genError}</p>
              </div>
            </div>
          )}

          {/* Generated Fix Result */}
          {generatedFix && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-primary">AI Generated Fix</h3>
                    {generatedFix.issue_id && (
                      <p className="text-xs font-mono text-ink-tertiary mt-0.5">Issue: {generatedFix.issue_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {generatedFix.confidence !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-teal/10 text-accent-teal border border-accent-teal/20">
                        {Math.round((generatedFix.confidence || 0) * 100)}% confidence
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      generatedFix.auto_fix
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {generatedFix.auto_fix ? '✓ Auto-fix eligible' : '⚠ Manual review required'}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                {generatedFix.explanation && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1">Explanation</p>
                    <p className="text-xs text-ink-secondary leading-relaxed">{generatedFix.explanation}</p>
                  </div>
                )}

                {/* Root Cause */}
                {generatedFix.root_cause && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1">Root Cause</p>
                    <p className="text-xs text-ink-secondary leading-relaxed">{generatedFix.root_cause}</p>
                  </div>
                )}

                {/* Impact */}
                {generatedFix.impact && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1">Impact</p>
                    <p className="text-xs text-ink-secondary leading-relaxed">{generatedFix.impact}</p>
                  </div>
                )}

                {/* Suggested Fix */}
                {generatedFix.suggested_fix && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1 flex items-center gap-1">
                      <Code2 className="w-3 h-3" /> Suggested Fix
                    </p>
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-200">
                      <pre>{generatedFix.suggested_fix}</pre>
                    </div>
                  </div>
                )}

                {/* Fixed Code */}
                {editedFixedCode !== undefined && generatedFix.auto_fix && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Proposed Fixed Code
                    </p>
                    <textarea
                      value={editedFixedCode}
                      onChange={(e) => setEditedFixedCode(e.target.value)}
                      className="w-full h-64 p-3 rounded-xl bg-surface-base border border-surface-border font-mono text-[11px] leading-relaxed text-ink-primary resize-y focus:outline-none focus:border-accent-violet"
                    />
                  </div>
                )}

                {/* Validate button */}
                {!validatedFix && (
                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    className="w-full py-2.5 text-xs font-semibold rounded-xl bg-surface-border hover:bg-surface-border/80 text-ink-secondary hover:text-accent-teal transition-all flex items-center justify-center gap-2"
                  >
                    {validating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</>
                    ) : (
                      <><Shield className="w-4 h-4" /> Validate Fix</>
                    )}
                  </button>
                )}
              </div>

              {/* Validation Error */}
              {valError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                  <AlertOctagon className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Validation failed</p>
                    <p className="text-xs mt-0.5 text-red-300/80">{valError}</p>
                  </div>
                </div>
              )}

              {/* Validation Result */}
              {validatedFix && (
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  validatedFix.success
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {validatedFix.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-red-400" />
                    )}
                    <h3 className={`text-sm font-semibold ${validatedFix.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      Validation {validatedFix.success ? 'Passed' : 'Failed'}
                    </h3>
                  </div>
                  {validatedFix.validation_detail && (
                    <p className="text-xs text-ink-secondary leading-relaxed">{validatedFix.validation_detail}</p>
                  )}
                  {validatedFix.errors && validatedFix.errors.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-xs text-red-300">
                      {validatedFix.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}

                  {/* Navigate to PR workflow only if validation passed */}
                  {validatedFix.success && (
                    <button
                      onClick={() => navigate('/pull-requests')}
                      className="w-full py-2.5 text-xs font-semibold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      <GitBranch className="w-4 h-4" />
                      Continue to GitHub Workflow
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
