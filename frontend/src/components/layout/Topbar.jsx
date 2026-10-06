import { useState, useEffect } from 'react'
import clsx from 'clsx'
import {
  ChevronDown,
  GitBranch,
  CheckCircle2,
  Clock,
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { api } from '../../services/api'

/* ── Mock data — partially left for notifications as it's not in api.js ───────────────────── */
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'critical', message: 'SQL injection detected in api-gateway', time: '2m ago' },
  { id: 2, type: 'high',     message: 'Exposed secret in auth-service',        time: '14m ago' },
  { id: 3, type: 'info',     message: 'Scan completed: frontend-app',          time: '1h ago' },
]

/* ── Repo Selector Dropdown ───────────────────────────────────── */
function RepoSelector({ selectedRepo, onSelect, repositories, loading }) {
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="topbar-chip flex items-center justify-center opacity-50">
        <Loader2 className="w-3 h-3 animate-spin mr-2" />
        <span className="text-xs">Loading...</span>
      </div>
    )
  }

  if (!selectedRepo) return null

  return (
    <div className="relative">
      <button
        id="topbar-repo-selector"
        className="topbar-chip"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select repository"
      >
        <GitBranch size={13} className="text-teal-400 shrink-0" aria-hidden="true" />
        <span className="font-medium text-ink-primary text-sm hidden sm:block max-w-[140px] truncate">
          hangova-io /&nbsp;
          <span className="text-teal-400">{selectedRepo.name}</span>
        </span>
        <span className="font-medium text-ink-primary text-sm sm:hidden truncate max-w-[90px]">
          {selectedRepo.name}
        </span>
        <ChevronDown
          size={12}
          className={clsx('text-ink-muted transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            role="listbox"
            aria-label="Repository list"
            className={clsx(
              'absolute top-full left-0 mt-2 z-20 w-60',
              'panel rounded-xl py-1.5 animate-fade-in-up',
            )}
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <p className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
              Repositories
            </p>
            {repositories?.map((repo) => (
              <button
                key={repo.id}
                role="option"
                aria-selected={repo.id === selectedRepo.id}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 text-left',
                  'transition-colors duration-150',
                  repo.id === selectedRepo.id
                    ? 'text-teal-400'
                    : 'text-ink-secondary hover:text-ink-primary',
                )}
                style={{
                  background:
                    repo.id === selectedRepo.id
                      ? 'rgba(20, 184, 166, 0.08)'
                      : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (repo.id !== selectedRepo.id)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  if (repo.id !== selectedRepo.id)
                    e.currentTarget.style.background = 'transparent'
                }}
                onClick={() => { onSelect(repo); setOpen(false) }}
              >
                <GitBranch size={13} className="shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{repo.name}</p>
                  <p className="text-2xs text-ink-muted leading-tight">hangova-io · {repo.branch}</p>
                </div>
                {repo.id === selectedRepo.id && (
                  <CheckCircle2 size={12} className="text-teal-400 shrink-0" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Notification Bell ────────────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unread = MOCK_NOTIFICATIONS.length

  const typeColor = {
    critical: 'text-red-400',
    high:     'text-orange-400',
    info:     'text-blue-400',
  }

  return (
    <div className="relative">
      <button
        id="topbar-notifications"
        className="btn-ghost relative flex items-center justify-center w-8 h-8 rounded-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${unread} unread notifications`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={16} strokeWidth={1.75} aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              color: 'white',
            }}
            aria-hidden="true"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Notifications"
            className={clsx(
              'absolute right-0 top-full mt-2 z-20 w-72',
              'panel rounded-xl py-1.5 animate-fade-in-up',
            )}
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-sm font-semibold text-ink-primary">Notifications</p>
              <button
                className="text-2xs text-teal-400 hover:text-teal-300 transition-colors"
                onClick={() => setOpen(false)}
              >
                Mark all read
              </button>
            </div>
            {MOCK_NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-150"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div
                  className={clsx('mt-0.5 h-1.5 w-1.5 rounded-full shrink-0', {
                    'bg-red-400':    n.type === 'critical',
                    'bg-orange-400': n.type === 'high',
                    'bg-blue-400':   n.type === 'info',
                  })}
                  style={{ marginTop: '5px' }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-xs font-medium leading-snug', typeColor[n.type])}>
                    {n.message}
                  </p>
                  <p className="text-2xs text-ink-muted mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
            <button
              className="w-full flex items-center justify-center gap-1 py-2 text-2xs text-ink-muted hover:text-ink-secondary transition-colors"
              onClick={() => setOpen(false)}
            >
              View all <ChevronRight size={10} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── User Menu ────────────────────────────────────────────────── */
function UserMenu({ user, loading }) {
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-lg bg-surface-card animate-pulse border border-surface-border"></div>
    )
  }

  if (!user) return null

  // Extract initials safely
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'

  return (
    <div className="relative">
      <button
        id="topbar-user-menu"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold shrink-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
            color: '#0c0f18',
          }}
          aria-hidden="true"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-ink-primary hidden sm:block">{user.login}</span>
        <ChevronDown
          size={12}
          className={clsx('text-ink-muted transition-transform duration-200 hidden sm:block', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="menu"
            aria-label="User options"
            className={clsx(
              'absolute right-0 top-full mt-2 z-20 w-48',
              'panel rounded-xl py-1.5 animate-fade-in-up',
            )}
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <div
              className="px-3 py-2"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-sm font-semibold text-ink-primary">{user.name}</p>
              <p className="text-2xs text-ink-muted">@{user.login}</p>
            </div>
            {[
              { icon: User,     label: 'Profile',  action: () => {} },
              { icon: Settings, label: 'Settings', action: () => {} },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                role="menuitem"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary transition-colors duration-150"
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { action(); setOpen(false) }}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            ))}
            <div className="divider my-1" />
            <button
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors duration-150"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => setOpen(false)}
            >
              <LogOut size={13} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Main Topbar ──────────────────────────────────────────────── */
export default function Topbar({ onMobileMenuOpen, sidebarCollapsed }) {
  const [repositories, setRepositories] = useState(null)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTopbarData() {
      try {
        const [userData, reposData] = await Promise.all([
          api.getAuthenticatedUser(),
          api.getRepositories(),
        ])
        setUser(userData)
        setRepositories(reposData)
        if (reposData.length > 0) {
          setSelectedRepo(reposData[0])
        }
      } catch (err) {
        console.error('Failed to load topbar data', err)
      } finally {
        setLoading(false)
      }
    }
    loadTopbarData()
  }, [])

  // Mock: last scanned time — replace with real scan data
  const lastScanned = '3 min ago'
  const githubConnected = !!user

  return (
    <header
      id="main-topbar"
      className={clsx(
        'sticky top-0 z-30 flex items-center w-full h-[56px] px-4 gap-3',
        'panel',
        'transition-all duration-300'
      )}
      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      {/* ── Mobile hamburger ─────────────────────────────────── */}
      <button
        id="topbar-mobile-menu"
        className="btn-ghost md:hidden flex items-center justify-center w-8 h-8 rounded-lg"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      {/* ── Repo selector ────────────────────────────────────── */}
      <RepoSelector 
        selectedRepo={selectedRepo} 
        onSelect={setSelectedRepo} 
        repositories={repositories} 
        loading={loading} 
      />

      {/* ── Spacer ───────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right side cluster ───────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* GitHub connection status */}
        <div
          id="topbar-github-status"
          className={clsx('topbar-chip hidden sm:flex', 'cursor-default')}
          title={githubConnected ? 'GitHub connected' : 'GitHub disconnected'}
          aria-label={`GitHub ${githubConnected ? 'connected' : 'disconnected'}`}
        >
          {/* GitHub icon (inline SVG — no extra lib needed) */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={githubConnected ? 'text-ink-secondary' : 'text-ink-muted'}
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
          </svg>
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className={clsx('status-dot', githubConnected ? 'online' : 'offline')}
              aria-hidden="true"
            />
            {githubConnected ? 'Connected' : 'Connect GitHub'}
          </span>
        </div>

        {/* Last scanned time */}
        <div
          id="topbar-last-scanned"
          className="topbar-chip hidden lg:flex cursor-default"
          aria-label={`Last scanned ${lastScanned}`}
          title={`Last scan: ${lastScanned}`}
        >
          <Clock size={13} className="text-ink-muted" aria-hidden="true" />
          <span className="text-xs text-ink-secondary">
            Scanned <span className="text-ink-primary font-medium">{lastScanned}</span>
          </span>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Divider */}
        <div
          className="hidden sm:block w-px h-5 mx-1"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-hidden="true"
        />

        {/* User menu */}
        <UserMenu user={user} loading={loading} />
      </div>
    </header>
  )
}
