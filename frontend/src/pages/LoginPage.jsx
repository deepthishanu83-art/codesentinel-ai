import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import {
  AuthLayout,
  AuthCard,
  GitHubButton,
  InputField,
  PasswordField,
  AuthError,
  AuthSuccess
} from '../components/auth/AuthComponents'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleGitHubLogin = async () => {
    setError(null)
    setIsGitHubLoading(true)
    // authService.loginWithGitHub() calls window.location.href = '/api/github/login'
    // which redirects the browser to GitHub OAuth — this function never returns.
    // On success GitHub redirects back to /auth/github/callback on the backend,
    // which sets the session cookie and then redirects to /dashboard.
    await authService.loginWithGitHub()
  }

  const validateForm = () => {
    let isValid = true
    setEmailError('')
    setPasswordError('')
    
    if (!email) {
      setEmailError('Please enter your email.')
      isValid = false
    } else if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Enter a valid email address.')
      isValid = false
    }
    
    if (!password) {
      setPasswordError('Please enter your password.')
      isValid = false
    }
    
    return isValid
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await authService.loginWithEmail(email, password)
      
      login(response.user)
      
      if (!response.user.emailVerified) {
        navigate('/verify-email', { state: { email } })
        return
      }
      
      setSuccess(true)
      setTimeout(() => navigate('/repositories'), 1500)
    } catch (err) {
      setError(err.message || 'Email or password is incorrect.')
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      brandingText="Welcome back."
      brandingSubtext="Continue securing your codebase with CodeSentinel AI."
    >
      <AuthCard>
        {success && <AuthSuccess message="Welcome to CodeSentinel AI" />}
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md shadow-teal-500/30 mx-auto mb-6 md:hidden">
            <ShieldCheck size={24} strokeWidth={2.5} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-[15px] text-teal-100/60 mt-2">Secure your codebase with AI-powered analysis.</p>
        </div>

        <AuthError message={error} />

        <div className="mt-8 mb-6">
          <GitHubButton
            label={isGitHubLoading ? "Connecting to GitHub..." : "Continue with GitHub"}
            onClick={handleGitHubLogin}
            isLoading={isGitHubLoading}
          />
        </div>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-teal-500/15"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-teal-100/30 uppercase tracking-wider">or continue with email</span>
          <div className="flex-grow border-t border-teal-500/15"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <InputField
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || isGitHubLoading}
            error={emailError}
          />
          
          <div>
            <PasswordField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGitHubLoading}
              error={passwordError}
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-[13px] font-medium text-teal-400 hover:text-teal-300 outline-none focus-visible:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGitHubLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[#071a1a] bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 disabled:opacity-70 disabled:cursor-not-allowed transition-all outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent mt-2 shadow-md shadow-teal-500/20"
          >
            {isLoading ? 'Signing you in...' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-teal-500/15 pt-6 mt-8">
          <p className="text-center text-[14px] text-teal-100/50">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
