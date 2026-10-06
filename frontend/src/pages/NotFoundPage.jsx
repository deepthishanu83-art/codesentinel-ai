import { Link } from 'react-router-dom'
import { ShieldCheck, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 text-center px-4 animate-fade-in-up">
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: 64,
          height: 64,
          background: 'rgba(20, 184, 166, 0.07)',
          border: '1px solid rgba(20, 184, 166, 0.15)',
        }}
      >
        <ShieldCheck size={28} className="text-teal-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-6xl font-black text-ink-muted mb-3">404</p>
        <h1 className="text-xl font-bold text-ink-primary mb-2">Page not found</h1>
        <p className="text-sm text-ink-secondary max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="btn-primary flex items-center gap-2"
      >
        <Home size={14} aria-hidden="true" />
        Back to Dashboard
      </Link>
    </div>
  )
}
