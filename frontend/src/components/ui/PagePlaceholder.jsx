import clsx from 'clsx'

/**
 * PagePlaceholder — temporary placeholder for pages not yet implemented.
 * Shows the page name and a "coming soon" message.
 * Replace each one with the real page component.
 */
export default function PagePlaceholder({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in-up text-center px-4">
      {Icon && (
        <div
          className="flex items-center justify-center rounded-2xl mb-2"
          style={{
            width: 56,
            height: 56,
            background: 'rgba(20, 184, 166, 0.08)',
            border: '1px solid rgba(20, 184, 166, 0.18)',
            boxShadow: '0 0 20px rgba(20, 184, 166, 0.08)',
          }}
        >
          <Icon size={24} className="text-teal-400" strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-ink-primary mb-2">{title}</h1>
        <p className="text-sm text-ink-secondary max-w-md">
          {description ?? 'This page is under construction. Check back soon.'}
        </p>
      </div>
      <span className="badge-muted mt-2">Coming soon</span>
    </div>
  )
}
