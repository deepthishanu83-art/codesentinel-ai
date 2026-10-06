import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import {
  ShieldCheck,
  LayoutDashboard,
  GitFork,
  ScanLine,
  TriangleAlert,
  Wrench,
  FileText,
  GitPullRequest,
  Rocket,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UploadCloud
} from 'lucide-react'

/* ── Navigation config ────────────────────────────────────────── */
const PRIMARY_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/repositories', icon: GitFork,          label: 'Repositories' },
  { to: '/upload',       icon: UploadCloud,      label: 'Upload & Scan' },
  { to: '/scans',        icon: ScanLine,         label: 'Scans' },
  { to: '/issues',       icon: TriangleAlert,    label: 'Issues' },
  { to: '/fixes',        icon: Wrench,           label: 'Fixes' },
]

const SECONDARY_NAV = [
  { to: '/readme',        icon: FileText,       label: 'README' },
  { to: '/pull-requests', icon: GitPullRequest, label: 'Pull Requests' },
  { to: '/deployments',   icon: Rocket,         label: 'Deployments' },
]

/* ── Sub-components ───────────────────────────────────────────── */
function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      id={`sidebar-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={({ isActive }) =>
        clsx(
          'relative flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none outline-none mb-1',
          collapsed ? 'px-0 justify-center' : 'px-3',
          isActive
            ? 'text-teal-400 bg-teal-500/10 shadow-[inset_3px_0_0_0_#2dd4bf]'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon
        size={18}
        aria-hidden="true"
        className="shrink-0"
        strokeWidth={2}
      />
      {!collapsed && (
        <span className="truncate animate-fade-in">{label}</span>
      )}
    </NavLink>
  )
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="mx-2 my-2 border-t border-white/10" />
  return (
    <p className="px-3 mb-1 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
      {label}
    </p>
  )
}

/* ── Main Sidebar ─────────────────────────────────────────────── */
/**
 * Sidebar — fixed left navigation rail.
 *
 * Props:
 *   collapsed  {boolean}  – is the rail in icon-only mode?
 *   onToggle   {function} – toggle collapsed state
 */
export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation()

  // Close mobile overlay on route change
  useEffect(() => {
    onMobileClose?.()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      {/* ── Sidebar panel ────────────────────────────────────── */}
      <aside
        id="main-sidebar"
        role="navigation"
        aria-label="Main navigation"
        className={clsx(
          // Base styles
          'fixed md:sticky left-0 top-0 h-screen z-40 flex flex-col shrink-0',
          'border-r border-white/5 transition-all duration-300 ease-in-out',
          // Width: collapsed vs expanded
          collapsed ? 'w-[72px]' : 'w-[260px]',
          // Mobile: slide in/out
          'max-md:translate-x-[-100%]',
          mobileOpen && 'max-md:translate-x-0 max-md:!w-[260px]',
        )}
        style={{ backgroundColor: '#0B1220' }}
      >
        {/* ── Brand ──────────────────────────────────────────── */}
        <div
          className={clsx(
            'flex items-center h-[56px] px-3 shrink-0',
            'border-b border-white/5',
          )}
        >
          <Link
            to="/"
            className={clsx(
              'flex items-center gap-2.5 no-underline group outline-none',
              collapsed && 'justify-center w-full',
            )}
            aria-label="CodeSentinel AI home"
          >
            {/* Shield icon */}
            <div
              className={clsx(
                'flex shrink-0 items-center justify-center rounded-lg',
                'transition-all duration-200 group-hover:scale-105',
                'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-sm shadow-teal-500/20'
              )}
              style={{ width: 32, height: 32 }}
            >
              <ShieldCheck size={18} strokeWidth={2.5} className="text-white" aria-hidden="true" />
            </div>

            {/* Brand text */}
            {!collapsed && (
              <div className="leading-none animate-fade-in overflow-hidden">
                <span className="block text-[15px] font-bold text-white tracking-tight whitespace-nowrap">
                  CodeSentinel <span className="text-teal-400">AI</span>
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* ── Scrollable nav area ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">

          {/* Primary navigation */}
          <nav aria-label="Primary navigation">
            {PRIMARY_NAV.map(({ to, icon, label }) => (
              <NavItem
                key={to}
                to={to}
                icon={icon}
                label={label}
                collapsed={collapsed}
              />
            ))}
          </nav>

          {/* Divider + secondary nav */}
          <SectionLabel label="Workflow" collapsed={collapsed} />

          <nav aria-label="Workflow navigation">
            {SECONDARY_NAV.map(({ to, icon, label }) => (
              <NavItem
                key={to}
                to={to}
                icon={icon}
                label={label}
                collapsed={collapsed}
              />
            ))}
          </nav>

          {/* AI badge — bottom of main nav */}
          {!collapsed && (
            <div
              className={clsx(
                'mt-5 mx-2 rounded-lg px-3 py-2.5 animate-fade-in',
                'flex items-start gap-2.5 bg-teal-500/5 border border-teal-500/10',
              )}
            >
              <Sparkles
                size={14}
                className="text-teal-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-[12px] font-semibold text-white leading-tight">
                  AI Analysis Active
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                  GPT-4o scanning engine
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom: Settings + collapse toggle ─────────────── */}
        <div
          className="shrink-0 px-2 py-3 border-t border-white/5"
        >
          <NavItem
            to="/settings"
            icon={Settings}
            label="Settings"
            collapsed={collapsed}
          />

          {/* Collapse toggle — desktop only */}
          <button
            id="sidebar-collapse-toggle"
            onClick={onToggle}
            className={clsx(
              'mt-1 w-full hidden md:flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none outline-none text-slate-400 hover:bg-white/5 hover:text-white',
              collapsed ? 'px-0 justify-center' : 'px-3',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={18} strokeWidth={2} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={18} strokeWidth={2} className="shrink-0" />
                <span className="text-sm animate-fade-in">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
