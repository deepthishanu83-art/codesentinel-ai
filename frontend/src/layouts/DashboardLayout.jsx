import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AnimatedBackground from '../components/layout/AnimatedBackground'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import clsx from 'clsx'

/**
 * DashboardLayout — root application shell.
 *
 * Manages:
 *   - Sidebar collapsed state (persisted to localStorage)
 *   - Mobile sidebar open/close state
 *   - Layout offset transitions when sidebar width changes
 *
 * Layer order (z-index):
 *   0  AnimatedBackground
 *   30 Topbar
 *   40 Sidebar
 *   Content lives between background and overlays
 */
export default function DashboardLayout() {
  const location = useLocation()

  // Sidebar collapsed state — defaults to CLOSED, no localStorage persistence
  const [collapsed, setCollapsed] = useState(true)

  // Mobile sidebar open state
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setCollapsed((c) => !c)

  return (
    <div className="dashboard-layout flex w-full min-h-screen relative overflow-hidden">

      {/* ── Skip-to-content link (keyboard / screen reader) ───── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:rounded-lg focus:bg-teal-400 focus:text-surface-950 focus:outline-none"
      >
        Skip to content
      </a>

      {/* ── Layer 0: Animated background ─────────────────────── */}
      <AnimatedBackground />

      {/* ── Layer 1: Sidebar ──────────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Layer 2: Main content area ────────────────────────── */}
      <div className="dashboard-main flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Topbar */}
        <Topbar
          onMobileMenuOpen={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
        />

        {/* Page content — rendered below topbar */}
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className="flex-1 overflow-y-auto animate-fade-in"
          key={location.pathname} // re-trigger entrance animation on navigation
        >
          {/* Content wrapper with generous padding */}
          <div className="dashboard-container w-full max-w-[1200px] mx-auto px-6 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
