import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

// Layout for Auth Pages
export function AuthLayout({ children, brandingText, brandingSubtext }) {
  return (
    <div className="min-h-screen text-white flex flex-col md:flex-row overflow-hidden relative" style={{ background: '#071a1a' }}>
      {/* Full-screen background image */}
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
        <div className="absolute inset-0 bg-[#071a1a]/60" />
      </div>

      {/* Left side: Branding (Hidden on mobile) */}
      <div className="hidden md:flex flex-col justify-between w-[45%] lg:w-[50%] p-10 lg:p-16 border-r border-teal-500/15 bg-black/10 backdrop-blur-sm relative">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-12 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg w-fit">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-500/30">
              <ShieldCheck size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight">
              CodeSentinel <span className="text-teal-400">AI</span>
            </span>
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">{brandingText}</h1>
          <p className="text-teal-100/60 text-[15px] max-w-sm leading-relaxed">
            {brandingSubtext}
          </p>
        </div>
        
        {/* Subtle abstract visual */}
        <div className="relative z-10 w-full max-w-sm mt-auto opacity-90">
           <div className="h-32 rounded-2xl bg-white/5 border border-teal-500/20 shadow-xl shadow-teal-500/5 backdrop-blur flex flex-col p-4 gap-2">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                 <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                 <div className="h-2 w-3/4 bg-teal-500/20 rounded-full" />
                 <div className="h-2 w-1/2 bg-teal-500/20 rounded-full" />
                 <div className="h-2 w-5/6 bg-teal-400/30 rounded-full mt-2" />
              </div>
           </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}

// Card Container
export function AuthCard({ children }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-teal-500/20 shadow-2xl shadow-black/30 rounded-3xl p-8 sm:p-10 w-full relative">
      {children}
    </div>
  )
}

// GitHub Button
export function GitHubButton({ onClick, isLoading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      type="button"
      className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
        </svg>
      )}
      {label}
    </button>
  )
}

// Input Field
export function InputField({ label, type = 'text', value, onChange, placeholder, disabled, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-teal-100">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-teal-100/30 focus:outline-none focus:ring-1 disabled:opacity-60 transition-colors ${
          error ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400' : 'border-teal-500/20 focus:border-teal-400 focus:ring-teal-400'
        }`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// Password Field
export function PasswordField({ label, value, onChange, placeholder, disabled, error }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-teal-100">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-teal-100/30 focus:outline-none focus:ring-1 disabled:opacity-60 transition-colors ${
            error ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400' : 'border-teal-500/20 focus:border-teal-400 focus:ring-teal-400'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-100/40 hover:text-teal-300 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// Error Message
export function AuthError({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[13px] font-medium animate-fade-in">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}

// Success Overlay
export function AuthSuccess({ message }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#071a1a]/90 backdrop-blur-sm rounded-3xl animate-fade-in text-center p-8">
      <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center mb-4">
        <CheckCircle2 size={24} className="text-teal-400" />
      </div>
      <h3 className="text-lg font-bold text-white">{message}</h3>
      <p className="text-sm text-teal-100/50 mt-1">Redirecting...</p>
    </div>
  )
}
