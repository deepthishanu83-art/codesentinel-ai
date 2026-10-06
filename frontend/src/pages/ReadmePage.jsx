import { BookOpen, GitFork } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export default function ReadmePage() {
  const navigate = useNavigate()
  const { selectedRepo } = useApp()

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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="pb-4 border-b border-surface-border/50">
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight">README Intelligence</h1>
        <p className="text-xs text-ink-tertiary mt-1">
          Repository: <span className="font-mono text-accent-cyan">{selectedRepo.full_name}</span>
        </p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 border border-dashed border-surface-border rounded-2xl p-8">
        <BookOpen className="w-12 h-12 text-ink-tertiary opacity-50" />
        <h2 className="text-lg font-semibold text-ink-primary">README generation is not connected yet</h2>
        <p className="text-sm text-ink-tertiary max-w-md">
          The AI README analysis and generation features are currently in development and not yet available in this release.
        </p>
      </div>
    </div>
  )
}
