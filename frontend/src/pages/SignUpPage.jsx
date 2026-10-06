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

export default function SignUpPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleGitHubSignup = async () => {
    setError(null)
    setIsGitHubLoading(true)
    try {
      const response = await authService.loginWithGitHub()
      login({ id: 'github_user', email: 'github@example.com', emailVerified: true, isGitHubAuth: true })
      setSuccess(true)
      setTimeout(() => navigate('/repositories'), 1500)
    } catch (err) {
      setError(err.message || 'GitHub authentication failed.')
      setIsGitHubLoading(false)
    }
  }

  const validateForm = () => {
    let isValid = true
    setNameError('')
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')
    
    if (!name.trim()) {
      setNameError('Please enter your full name.')
      isValid = false
    }
    
    if (!email) {
      setEmailError('Please enter your email.')
      isValid = false
    } else if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Enter a valid email address.')
      isValid = false
    }
    
    if (!password) {
      setPasswordError('Please enter a password.')
      isValid = false
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      isValid = false
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter.')
      isValid = false
    } else if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number.')
      isValid = false
    }
    
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.')
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      isValid = false
    }
    
    return isValid
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await authService.signUpWithEmail(name, email, password)
      login(response.user)
      setSuccess(true)
      setTimeout(() => navigate('/verify-email', { state: { email } }), 1500)
    } catch (err) {
      setError(err.message || 'Registration failed.')
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      brandingText="Join CodeSentinel AI."
      brandingSubtext="Automate your code reviews and ship safer code faster."
    >
      <AuthCard>
        {success && <AuthSuccess message="Account created successfully!" />}
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-violet-600 shadow-md shadow-blue-500/25 mx-auto mb-6 md:hidden">
            <ShieldCheck size={24} strokeWidth={2.5} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Create your account</h2>
          <p className="text-[15px] text-slate-500 mt-2">Start finding, fixing and shipping safer code.</p>
        </div>

        <AuthError message={error} />

        <form onSubmit={handleEmailSignup} className="space-y-4 mt-6">
          <InputField
            label="Full name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading || isGitHubLoading}
            error={nameError}
          />
          
          <InputField
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || isGitHubLoading}
            error={emailError}
          />
          
          <PasswordField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || isGitHubLoading}
            error={passwordError}
          />
          
          <PasswordField
            label="Confirm password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading || isGitHubLoading}
            error={confirmPasswordError}
          />

          <button
            type="submit"
            disabled={isLoading || isGitHubLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 mt-4 shadow-md shadow-blue-500/20"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex items-center py-2 my-6">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">or sign up with</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <GitHubButton
          label={isGitHubLoading ? "Connecting..." : "Continue with GitHub"}
          onClick={handleGitHubSignup}
          isLoading={isGitHubLoading}
        />

        <p className="text-center text-[13px] text-slate-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
