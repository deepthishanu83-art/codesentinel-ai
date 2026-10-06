import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/auth'
import {
  AuthLayout,
  AuthCard,
  InputField,
  AuthError
} from '../components/auth/AuthComponents'
import { KeyRound, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSent, setIsSent] = useState(false)

  const validateForm = () => {
    let isValid = true
    setEmailError('')
    
    if (!email) {
      setEmailError('Please enter your email.')
      isValid = false
    } else if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Enter a valid email address.')
      isValid = false
    }
    
    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      await authService.forgotPassword(email)
      setIsSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset instructions.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <AuthLayout
        brandingText="Reset your password"
        brandingSubtext="We'll help you get back into your account."
      >
        <AuthCard>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 mx-auto mb-6">
              <KeyRound size={24} strokeWidth={2} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-950 tracking-tight">Check your email</h2>
            <p className="text-[15px] text-slate-500 mt-3 leading-relaxed">
              We've sent password reset instructions if an account exists for <span className="font-semibold text-slate-900">{email}</span>.
            </p>
          </div>
          
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-[14px] text-slate-500">
              Didn't receive the email?{' '}
              <button onClick={() => setIsSent(false)} className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Try again
              </button>
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Sign in
            </Link>
          </div>
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      brandingText="Reset your password"
      brandingSubtext="We'll help you get back into your account."
    >
      <AuthCard>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 mx-auto mb-6">
            <KeyRound size={24} strokeWidth={2} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-950 tracking-tight">Reset your password</h2>
          <p className="text-[15px] text-slate-500 mt-2">Enter your email and we'll send you a reset link.</p>
        </div>

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <InputField
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            error={emailError}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 mt-4 shadow-md shadow-blue-500/20"
          >
            {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Back to Sign in
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
