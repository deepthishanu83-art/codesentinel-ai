import { useState } from 'react'
import {
  UploadCloud,
  FileCode,
  ShieldAlert,
  Loader2,
  AlertOctagon,
  CheckCircle2,
  Wrench,
  Download,
  RotateCcw,
  X
} from 'lucide-react'
import { api } from '../services/api'

const ALLOWED_EXTENSIONS = {
  'py': 'python',
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'go': 'go'
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

function severityColor(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'HIGH':     return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    case 'MEDIUM':   return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    case 'LOW':      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    default:         return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
}

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [language, setLanguage] = useState(null)
  const [sourceCode, setSourceCode] = useState(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  const [selectedFinding, setSelectedFinding] = useState(null)
  
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)
  const [fixResult, setFixResult] = useState(null)
  const [editedFixedCode, setEditedFixedCode] = useState("")

  const [validating, setValidating] = useState(false)
  const [valError, setValError] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  
  const [applySuccess, setApplySuccess] = useState(false)

  // Issue Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    setFileError(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setSelectedFinding(null)
    setFixResult(null)
    setEditedFixedCode("")
    setValidationResult(null)
    setApplySuccess(false)
    
    const ext = selectedFile.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS[ext]) {
      setFileError('Unsupported file type. Please upload a source-code file.')
      setFile(null)
      setSourceCode(null)
      return
    }

    setLanguage(ALLOWED_EXTENSIONS[ext])
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      setSourceCode(e.target.result)
    }
    reader.onerror = () => {
      setFileError('Failed to read the file.')
      setFile(null)
      setSourceCode(null)
    }
    reader.readAsText(selectedFile)
  }

  const handleAnalyze = async () => {
    if (!file || !sourceCode || !language) return
    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const result = await api.analyzeLocalFile(
        'local',
        'uploaded-file',
        'local',
        file.name,
        language,
        sourceCode
      )
      setAnalysisResult(result)
    } catch (err) {
      setAnalysisError(err.message || 'CodeSentinel backend is unavailable.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSelectFinding = (finding) => {
    setSelectedFinding(finding)
    setFixResult(null)
    setEditedFixedCode("")
    setValidationResult(null)
    setGenError(null)
    setValError(null)
    setApplySuccess(false)
  }

  const handleViewDetails = (finding) => {
    setSelectedFinding(finding)
    setFixResult(null)
    setEditedFixedCode("")
    setValidationResult(null)
    setGenError(null)
    setValError(null)
    setApplySuccess(false)
    setShowDetailsModal(true)
  }

  const handleFixIssue = (finding) => {
    setSelectedFinding(finding)
    setFixResult(null)
    setEditedFixedCode("")
    setValidationResult(null)
    setGenError(null)
    setValError(null)
    setApplySuccess(false)
    setGenError(null)
    setValError(null)
    setApplySuccess(false)
    setShowDetailsModal(false)
  }

  const handleGenerateFix = async () => {
    if (!selectedFinding) return
    setGenerating(true)
    setGenError(null)
    setFixResult(null)
    setEditedFixedCode("")
    setValidationResult(null)
    setApplySuccess(false)
    try {
      const res = await api.generateLocalFix(
        'local',
        'uploaded-file',
        'local',
        selectedFinding,
        sourceCode
      )
      const fix = res.fix || res
      setFixResult(fix)
      setEditedFixedCode(fix.fixed_code || fix.patch || fix.suggested_fix || "")
      setApplySuccess(false)
    } catch (err) {
      setGenError(err.message || 'Failed to generate fix.')
    } finally {
      setGenerating(false)
    }
  }

  const handleValidate = async () => {
    if (!fixResult || !editedFixedCode) return
    setValidating(true)
    setValError(null)
    setValidationResult(null)
    try {
      // Send the currently edited code as the patch for validation
      const payloadToValidate = { ...fixResult, patch: editedFixedCode, fixed_code: editedFixedCode }
      const result = await api.validateFix(payloadToValidate)
      setValidationResult(result)
    } catch (err) {
      setValError(err.message || 'Validation failed — review the proposed fix.')
    } finally {
      setValidating(false)
    }
  }

  const handleApplyFix = () => {
    if (!editedFixedCode) return
    setSourceCode(editedFixedCode)
    setApplySuccess(true)
    setTimeout(() => setApplySuccess(false), 3000)
  }

  const handleDownload = () => {
    if (!editedFixedCode) return
    
    const blob = new Blob([editedFixedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const originalName = file ? file.name : 'uploaded-file.py'
    const parts = originalName.split('.')
    const ext = parts.length > 1 ? parts.pop() : 'py'
    const name = parts.join('.') || 'uploaded-file'
    
    link.download = `${name}-fixed.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setFile(null)
    setFileError(null)
    setLanguage(null)
    setSourceCode(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setSelectedFinding(null)
    setFixResult(null)
    setEditedFixedCode("")
    setValidationResult(null)
    setGenError(null)
    setValError(null)
    setApplySuccess(false)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="pb-4 border-b border-surface-border/50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-accent-cyan" />
            Upload a Code File
          </h1>
          <p className="text-xs text-ink-tertiary mt-1">
            Upload a source file and CodeSentinel will analyze it for bugs, security vulnerabilities and code quality issues.
          </p>
        </div>
        {(file || analysisResult) && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-card hover:bg-surface-border text-ink-secondary border border-surface-border transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Upload Another File
          </button>
        )}
      </div>

      {!file && !analyzing && !analysisResult && (
        <div className="p-8 border-2 border-dashed border-surface-border rounded-2xl bg-surface-card flex flex-col items-center justify-center space-y-4">
          <FileCode className="w-12 h-12 text-ink-tertiary" />
          <p className="text-sm font-semibold text-ink-primary">Please upload a source-code file.</p>
          {fileError && <p className="text-xs text-red-400 font-medium">{fileError}</p>}
          <label className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal/20 hover:bg-accent-teal/30 text-accent-teal transition-all cursor-pointer">
            Select File
            <input type="file" required className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      )}

      {file && !analysisResult && !analyzing && (
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-accent-cyan" />
            <div>
              <p className="text-sm font-semibold text-ink-primary">{file.name}</p>
              <p className="text-xs text-ink-tertiary capitalize">Language: {language}</p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent-teal text-surface-950 transition-all flex items-center justify-center gap-2"
          >
            Run CodeSentinel Analysis
          </button>
          {analysisError && <p className="text-xs text-red-400 text-center font-medium mt-2">{analysisError}</p>}
        </div>
      )}

      {analyzing && (
        <div className="p-8 rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent-cyan" />
          <p className="font-semibold text-ink-primary text-sm">Analyzing uploaded file...</p>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
             <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">File</p>
              <p className="text-sm font-mono font-bold text-ink-primary truncate">{file.name}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Language</p>
              <p className="text-sm font-mono font-bold text-ink-primary capitalize">{language}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Risk Score</p>
              <p className={`text-xl font-mono font-bold ${riskColor(analysisResult.risk_level)}`}>
                {analysisResult.risk_score ?? 'N/A'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Risk Level</p>
              <p className={`text-sm font-mono font-bold ${riskColor(analysisResult.risk_level)}`}>
                {analysisResult.risk_level || 'N/A'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <p className="text-[10px] uppercase text-ink-tertiary mb-1">Issue Count</p>
              <p className="text-xl font-mono font-bold text-ink-primary">
                {analysisResult.total_issues ?? analysisResult.issues?.length ?? 0}
              </p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
            <p className="text-[10px] uppercase text-ink-tertiary mb-1">Release Decision</p>
            <p className="text-sm font-mono font-bold text-ink-primary">{analysisResult.release_decision || 'N/A'}</p>
            {analysisResult.release_reason && <p className="text-xs text-ink-tertiary mt-1">{analysisResult.release_reason}</p>}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-primary flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent-violet" />
              Detected Issues
            </h3>
            
            {(!analysisResult.issues || analysisResult.issues.length === 0) ? (
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-center text-sm font-semibold text-emerald-400 flex justify-center items-center gap-2">
                 ✅ No issues detected in this file.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {analysisResult.issues.map((issue, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border transition-all ${selectedFinding === issue ? 'border-accent-violet bg-accent-violet/5' : 'border-surface-border bg-surface-card hover:border-surface-border/80'}`}>
                    <div className="flex items-start justify-between">
                       <div>
                         <p className="text-sm font-semibold text-ink-primary">{issue.title || "Issue detected"}</p>
                         <p className="text-[10px] font-mono text-ink-tertiary mt-1">Line {issue.line} | {issue.category}</p>
                       </div>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityColor(issue.severity)}`}>
                         {issue.severity}
                       </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                       <button
                         onClick={() => handleViewDetails(issue)}
                         className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-base hover:bg-surface-border text-ink-primary border border-surface-border transition-all"
                       >
                         View Details
                       </button>
                       <button
                         onClick={() => handleFixIssue(issue)}
                         className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-violet/20 hover:bg-accent-violet/30 text-accent-violet border border-accent-violet/30 transition-all"
                       >
                         Fix Issue
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      {showDetailsModal && selectedFinding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6 space-y-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-ink-primary">{selectedFinding.title || 'Issue Details'}</h2>
                <p className="text-[10px] font-mono text-ink-tertiary mt-0.5">{selectedFinding.file || 'uploaded-file'} · Line {selectedFinding.line}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-border text-ink-tertiary hover:text-ink-primary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityColor(selectedFinding.severity)}`}>
                {selectedFinding.severity}
              </span>
              {selectedFinding.category && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-base border border-surface-border text-ink-secondary">
                  {selectedFinding.category}
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3 text-xs">
              {selectedFinding.description && (
                <div>
                  <p className="font-bold text-ink-tertiary mb-1">Description</p>
                  <p className="text-ink-secondary leading-relaxed">{selectedFinding.description}</p>
                </div>
              )}
              {selectedFinding.recommendation && (
                <div>
                  <p className="font-bold text-ink-tertiary mb-1">Recommendation</p>
                  <p className="text-ink-secondary leading-relaxed">{selectedFinding.recommendation}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-surface-border/50 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleGenerateFix()
                }}
                disabled={generating}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-60 text-white shadow-lg shadow-accent-violet/25 transition-all flex items-center gap-2"
              >
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Wrench className="w-4 h-4" /> Generate Fix</>}
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-base hover:bg-surface-border border border-surface-border text-ink-primary transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline fix panel shown when Fix Issue is clicked (no modal) */}
      {selectedFinding && !showDetailsModal && (
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border mt-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-md font-bold text-ink-primary">Issue Details — {selectedFinding.title || 'Issue detected'}</h3>
            <button
              onClick={() => setSelectedFinding(null)}
              className="p-1 rounded hover:bg-surface-border text-ink-tertiary hover:text-ink-primary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
            <div><span className="font-bold text-ink-tertiary">Category:</span> {selectedFinding.category}</div>
            <div><span className="font-bold text-ink-tertiary">Severity:</span> {selectedFinding.severity}</div>
            <div><span className="font-bold text-ink-tertiary">File:</span> {selectedFinding.file || 'uploaded-file'}</div>
            <div><span className="font-bold text-ink-tertiary">Line:</span> {selectedFinding.line}</div>
          </div>
          {selectedFinding.description && (
            <div className="mb-2">
              <span className="font-bold text-ink-tertiary text-xs">Description:</span>
              <p className="text-xs text-ink-secondary mt-1">{selectedFinding.description}</p>
            </div>
          )}
          {selectedFinding.recommendation && (
            <div className="mb-4">
              <span className="font-bold text-ink-tertiary text-xs">Recommendation:</span>
              <p className="text-xs text-ink-secondary mt-1">{selectedFinding.recommendation}</p>
            </div>
          )}
          <div className="pt-4 border-t border-surface-border/50">
             <button
               onClick={handleGenerateFix}
               disabled={generating}
               className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-60 text-white shadow-lg shadow-accent-violet/25 transition-all flex items-center gap-2"
             >
               {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating proposed fix...</> : <><Wrench className="w-4 h-4" /> Generate Fix</>}
             </button>
             {genError && <p className="text-xs text-red-400 mt-2">{genError}</p>}
          </div>
        </div>
      )}

      {fixResult && (
        <div className="space-y-4">
           <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-bold text-ink-primary">Generated Fix</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${fixResult.auto_fix ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                   {fixResult.auto_fix ? 'Auto-fix eligible' : 'Manual review required'}
                </span>
             </div>
             
             <div className="space-y-3 text-xs text-ink-secondary mb-4">
               {fixResult.explanation && <div><span className="font-bold text-ink-tertiary">Explanation:</span> {fixResult.explanation}</div>}
               {fixResult.root_cause && <div><span className="font-bold text-ink-tertiary">Root Cause:</span> {fixResult.root_cause}</div>}
               {fixResult.impact && <div><span className="font-bold text-ink-tertiary">Impact:</span> {fixResult.impact}</div>}
               {fixResult.suggested_fix && <div><span className="font-bold text-ink-tertiary">Suggested Fix:</span> {fixResult.suggested_fix}</div>}
               {fixResult.confidence !== undefined && <div><span className="font-bold text-ink-tertiary">Confidence:</span> {Math.round(fixResult.confidence * 100)}%</div>}
               {fixResult.issue_id && <div><span className="font-bold text-ink-tertiary">Issue ID:</span> {fixResult.issue_id}</div>}
             </div>

             {!fixResult.fixed_code && !fixResult.patch && (
               <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                 AI generated a suggestion but no concrete replacement code was returned.
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-surface-border bg-surface-base overflow-hidden flex flex-col">
                   <div className="p-2 border-b border-surface-border/50 text-[10px] font-bold uppercase text-ink-tertiary text-center">Original Code</div>
                   <pre className="p-3 text-[10px] font-mono text-ink-secondary overflow-auto flex-1 h-64">{sourceCode}</pre>
                </div>
                <div className="rounded-xl border border-surface-border bg-surface-base overflow-hidden flex flex-col">
                   <div className="p-2 border-b border-surface-border/50 text-[10px] font-bold uppercase text-ink-tertiary text-center">Proposed Fix (Editable)</div>
                   <textarea
                     className="p-3 text-[10px] font-mono text-emerald-400 bg-transparent resize-none focus:outline-none flex-1 h-64 w-full"
                     value={editedFixedCode}
                     onChange={(e) => setEditedFixedCode(e.target.value)}
                     spellCheck="false"
                   />
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-surface-border/50 flex items-center gap-3">
               <button
                 onClick={handleApplyFix}
                 className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/30 text-accent-violet transition-all flex items-center gap-2"
               >
                 Apply Fix
               </button>

               <button
                 onClick={handleValidate}
                 disabled={validating}
                 className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-base hover:bg-surface-border border border-surface-border text-ink-primary transition-all flex items-center gap-2"
               >
                 {validating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating proposed fix...</> : <><CheckCircle2 className="w-4 h-4" /> Validate Fix</>}
               </button>

               {validationResult?.is_valid && (
                 <button
                   onClick={handleDownload}
                   className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-teal text-surface-950 transition-all flex items-center gap-2"
                 >
                   <Download className="w-4 h-4" />
                   Download Fixed File
                 </button>
               )}
             </div>
             {applySuccess && <p className="text-xs text-emerald-400 mt-2 font-medium">Proposed fix applied to working copy.</p>}
             {valError && <p className="text-xs text-red-400 mt-2">{valError}</p>}
             {validationResult && (
               <div className={`mt-3 p-3 rounded-xl border text-xs font-semibold ${validationResult.is_valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {validationResult.is_valid ? '✅ Fix validated successfully' : 'Validation failed — review the proposed fix.'}
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  )
}
