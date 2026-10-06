import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ShieldCheck,
  GitPullRequest,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  FileCode,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   OAUTH INTEGRATION POINT
   Replace this handler with your real GitHub
   OAuth initiation (redirect to /auth/github).
──────────────────────────────────────────────── */
function handleConnectGitHub() {
  // TODO: window.location.href = '/auth/github'
  console.info('[CodeSentinel] GitHub OAuth — integration point')
}

/* ══════════════════════════════════════════════
   NAV BAR
══════════════════════════════════════════════ */
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Home', href: '#hero' },
    
  ]

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#071a1a]/80 backdrop-blur-xl shadow-lg border-b border-teal-500/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between">
        {/* Brand */}
        <a href="#hero" className="flex items-center gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg" aria-label="CodeSentinel AI home">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-500/30">
            <ShieldCheck size={16} strokeWidth={2.5} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">
            CodeSentinel <span className="text-teal-400">AI</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-teal-100/80 hover:text-teal-300 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-teal-100/80 hover:text-teal-300 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            Login
          </Link>
          <button
            onClick={handleConnectGitHub}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#071a1a] rounded-lg bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-md shadow-teal-500/30 transition-all hover:shadow-teal-500/50 hover:-translate-y-px active:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
            </svg>
            Connect GitHub
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-teal-100/80 hover:text-teal-300 hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#071a1a]/90 backdrop-blur-xl border-b border-teal-500/20 px-5 pb-5 pt-2 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-teal-100/80 hover:text-teal-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-teal-500/20 mt-2">
            <Link
              to="/login"
              className="px-3 py-2.5 text-sm font-medium text-teal-100/80 rounded-lg text-center border border-teal-500/30 hover:bg-white/5 transition-colors"
            >
              Login
            </Link>
            <button
              onClick={handleConnectGitHub}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#071a1a] rounded-lg bg-gradient-to-r from-teal-400 to-cyan-400"
            >
              Connect GitHub
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

/* ══════════════════════════════════════════════
   HERO VISUAL — abstract security product mockup
══════════════════════════════════════════════ */
function HeroVisual() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto" aria-hidden="true">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-violet-400/15 to-teal-300/10 rounded-3xl blur-3xl scale-105" />

      {/* Main code editor card */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Editor chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-700/60">
          <span className="w-3 h-3 rounded-full bg-red-400/80" />
          <span className="w-3 h-3 rounded-full bg-amber-400/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/50">
            <FileCode size={11} className="text-slate-400" />
            <span className="text-[11px] text-slate-400 font-mono">auth.py</span>
          </div>
        </div>

        {/* Code body */}
        <div className="bg-slate-900 px-4 py-4 font-mono text-[12px] leading-6 space-y-0.5">
          {/* Normal lines */}
          <div className="text-slate-500"><span className="text-slate-600 select-none mr-4">1</span><span className="text-violet-400">def</span> <span className="text-blue-300">get_user</span><span className="text-slate-300">(email):</span></div>
          <div className="text-slate-500"><span className="text-slate-600 select-none mr-4">2</span><span className="text-slate-400 ml-4"># authenticate user by email</span></div>

          {/* Vulnerable line — red highlight */}
          <div className="relative rounded-md bg-red-500/12 border-l-2 border-red-400 mx-[-4px] px-1">
            <div className="flex items-start">
              <span className="text-slate-600 select-none mr-3 ml-1">3</span>
              <span>
                <span className="text-slate-400 ml-2">query = </span>
                <span className="text-amber-300">f</span>
                <span className="text-emerald-300">"SELECT * FROM users</span>
                <span className="text-red-300"> WHERE email=</span>
                <span className="text-amber-300">{'{'}</span>
                <span className="text-blue-300">email</span>
                <span className="text-amber-300">{'}'}</span>
                <span className="text-emerald-300">"</span>
              </span>
            </div>
            {/* Vulnerability tooltip */}
            <div className="absolute -right-1 top-0 translate-x-full ml-2 z-10 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-semibold shadow-lg shadow-red-500/30 whitespace-nowrap">
              <AlertTriangle size={9} strokeWidth={2.5} />
              SQL Injection · Critical
            </div>
          </div>

          <div className="text-slate-500"><span className="text-slate-600 select-none mr-4">4</span><span className="text-slate-400 ml-4">cursor.</span><span className="text-blue-300">execute</span><span className="text-slate-300">(query)</span></div>
          <div className="text-slate-500"><span className="text-slate-600 select-none mr-4">5</span><span className="text-violet-400 ml-4">return</span> <span className="text-slate-300">cursor.</span><span className="text-blue-300">fetchone</span><span className="text-slate-300">()</span></div>
        </div>

        {/* AI Fix suggestion bar */}
        <div className="border-t border-slate-700/60 bg-slate-900 px-4 py-3">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={11} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-emerald-300 mb-1">AI Fix — Parameterized Query</p>
              <div className="font-mono text-[11px] text-emerald-200/80 leading-5">
                <span className="text-slate-400">query = </span>
                <span className="text-emerald-300">"SELECT * FROM users WHERE email = <span className="text-blue-300">%s</span>"</span>
              </div>
              <div className="font-mono text-[11px] text-emerald-200/80 leading-5">
                <span className="text-blue-300">cursor</span><span className="text-slate-400">.execute(query, </span><span className="text-amber-300">(email,)</span><span className="text-slate-400">)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation panel — floats bottom-left */}
      <div className="absolute -bottom-5 -left-4 sm:-left-10 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-900/8 px-3.5 py-3 min-w-[180px]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Validation</p>
        {[
          { label: 'Syntax check', ok: true },
          { label: 'Unit tests 14/14', ok: true },
          { label: 'SAST re-scan', ok: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 mb-1 last:mb-0">
            <CheckCircle2 size={13} className="text-teal-500 shrink-0" />
            <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* PR status badge — floats top-right */}
      <div className="absolute -top-4 -right-2 sm:-right-8 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-900/8 px-3.5 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shrink-0">
          <GitPullRequest size={14} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-800">PR #104 Ready</p>
          <p className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block animate-pulse" />
            Merged to main
          </p>
        </div>
      </div>

      {/* Risk reduction badge — floats mid-left */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-12 bg-gradient-to-br from-blue-600 to-violet-700 rounded-xl shadow-lg shadow-violet-500/30 px-3 py-2.5 text-center">
        <p className="text-[18px] font-black text-white leading-none">75%</p>
        <p className="text-[9px] font-semibold text-blue-200 uppercase tracking-wider mt-0.5">Risk↓</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   FEATURE CARDS
══════════════════════════════════════════════ */
const FEATURES = [
  {
    id: 'detect',
    icon: AlertTriangle,
    iconColor: 'from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-500/25',
    badge: 'Detect',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    title: 'Find it before it ships',
    description: 'Continuous static analysis catches SQL injection, exposed secrets, vulnerable dependencies, and code quality regressions — on every commit.',
    stat: '98%',
    statLabel: 'Accuracy',
  },
  {
    id: 'fix',
    icon: Sparkles,
    iconColor: 'from-blue-500 to-violet-600',
    iconShadow: 'shadow-blue-500/25',
    badge: 'Fix',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    title: 'AI-generated, validated fixes',
    description: 'CodeSentinel generates minimal, targeted patches, runs your test suite, performs a SAST re-scan, and confirms the fix is safe before touching your codebase.',
    stat: '< 2s',
    statLabel: 'Fix time',
  },
  {
    id: 'release',
    icon: GitPullRequest,
    iconColor: 'from-teal-500 to-emerald-600',
    iconShadow: 'shadow-teal-500/25',
    badge: 'Release',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    title: 'PR, README, deploy',
    description: 'Automatically creates a branch, commits the verified fix, updates your README, opens a pull request, and guides the full deployment pipeline.',
    stat: '1-click',
    statLabel: 'To PR',
  },
]


/* ══════════════════════════════════════════════
   HOW IT WORKS — compact 4-step flow
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   ABOUT SECTION
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   LANDING FOOTER
══════════════════════════════════════════════ */
function LandingFooter() {
  return (
    <footer className="border-t border-teal-500/15 py-8 px-5 sm:px-8 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
            <ShieldCheck size={12} strokeWidth={2.5} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-white">CodeSentinel <span className="text-teal-400">AI</span></span>
        </div>
        <p className="text-xs text-teal-100/40">
          © {new Date().getFullYear()} CodeSentinel AI. All rights reserved.
        </p>
        <Link
          to="/login"
          className="text-xs font-medium text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
        >
          Sign In →
        </Link>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#071a1a' }}>
      {/* ── Full-screen background image ─────────────────── */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: 'url(/tech-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay to ensure readability */}
        <div className="absolute inset-0 bg-[#071a1a]/55" />
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <LandingNavbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative pt-32 pb-20 px-5 sm:px-8 min-h-[90vh] flex items-center"
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: text content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-400/30 text-xs font-semibold text-teal-300 mb-7 shadow-sm backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
                AI-Powered Code Security
              </div>

              {/* Heading */}
              <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
                Ship safer<br />code.{' '}
                <span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(135deg, #2dd4bf 0%, #22d3ee 50%, #38bdf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Fix smarter.
                </span>
              </h1>

              {/* Description */}
              <p className="text-[17px] text-teal-100/70 leading-relaxed max-w-[480px] mb-8">
                AI-powered code review that finds vulnerabilities, generates fixes, validates them, and prepares your repository for release — automatically.
              </p>

              {/* CTA group */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={handleConnectGitHub}
                  id="hero-connect-github"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-[#071a1a] bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                  </svg>
                  Connect GitHub
                  <ArrowRight size={15} aria-hidden="true" />
                </button>

                <Link
                  to="/login"
                  className="text-sm font-medium text-teal-300/70 hover:text-teal-300 transition-colors underline underline-offset-2"
                >
                  Already connected? Sign in
                </Link>
              </div>

              {/* Social proof micro-text */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['#14b8a6','#22d3ee','#2dd4bf','#06b6d4'].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-teal-900 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: c }}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-teal-300/60">
                  <span className="text-teal-200 font-semibold">2,400+</span> teams ship safer code
                </p>
              </div>
            </div>

            {/* Right: hero visual */}
            <div className="flex justify-center lg:justify-end">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      

      

      {/* ── Bottom tagline ───────────────────────────────── */}
      <section className="py-12 px-5 sm:px-8 text-center">
        <h2
          className="text-4xl sm:text-5xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #2dd4bf 40%, #22d3ee 70%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Find it. Fix it. Ship it.
        </h2>
        <p className="text-teal-100/50 text-sm mt-3 tracking-wide">The complete security release loop.</p>
      </section>

      

      {/* ── Footer ───────────────────────────────────────── */}
      <LandingFooter />
    </div>
  )
}
