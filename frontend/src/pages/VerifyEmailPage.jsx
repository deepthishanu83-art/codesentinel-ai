import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import {
  AuthLayout,
  AuthCard,
  AuthError,
  AuthSuccess
} from '../components/auth/AuthComponents'
import { Mail, ArrowRight } from 'lucide-react'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your email'
  
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    let timer
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  // Simulate picking up a token from the URL in a real app
  // useEffect(() => { ... verify token ... }, [])

  const handleResend = async () => {
    if (cooldown > 0) return
    
    setError(null)
    setSuccessMessage('')
    setIsResending(true)
    
    try {
      await authService.resendVerification(email)
      setSuccessMessage('Verification email sent!')
      setCooldown(60)
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSimulateVerify = async () => {
    // This is just for demonstration purposes since we don't have real emails
    try {
      await authService.verifyEmail('mock-token')
      setIsVerified(true)
    } catch (err) {
      setError(err.message)
    }
  }

  if (isVerified) {
    return (
      <AuthLayout
        brandingText="Verify your email"
        brandingSubtext="Secure your CodeSentinel AI account."
      >
        <AuthCard>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-indigo-950 tracking-tight">Email verified</h2>
            <p className="text-[15px] text-slate-500 mt-2">Your account is ready.</p>
          </div>
          
          <button
            onClick={() => navigate('/repositories')}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 mt-4 shadow-md shadow-blue-500/20"
          >
            Continue to CodeSentinel AI <ArrowRight size={16} />
          </button>
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      brandingText="Verify your email"
      brandingSubtext="Secure your CodeSentinel AI account."
    >
      <AuthCard>
        {successMessage && !error && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[13px] font-medium text-center">
            {successMessage}
          </div>
        )}
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 mx-auto mb-6">
            <Mail size={24} strokeWidth={2} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-950 tracking-tight">Verify your email</h2>
          <p className="text-[15px] text-slate-500 mt-3 leading-relaxed">
            We've sent a verification link to:<br/>
            <span className="font-semibold text-slate-900">{email}</span>
          </p>
        </div>

        <AuthError message={error} />

        <div className="space-y-4 mt-8">
          <button
            onClick={handleSimulateVerify}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-md shadow-blue-500/20"
          >
            Open Email
          </button>
          
          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-[13px] text-slate-500 mb-3">Didn't receive the email?</p>
            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:hover:text-blue-600 transition-colors"
            >
              {isResending ? 'Sending...' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/signup" className="text-[13px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Change email
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
