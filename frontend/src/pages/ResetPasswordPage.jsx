import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import {
  AuthLayout,
  AuthCard,
  PasswordField,
  AuthError,
  AuthSuccess
} from '../components/auth/AuthComponents'
import { KeyRound } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // In a real app we'd parse the reset token from the URL query or params
  const token = 'mock-reset-token'

  const validateForm = () => {
    let isValid = true
    setPasswordError('')
    setConfirmPasswordError('')
    
    if (!password) {
      setPasswordError('Please enter a new password.')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setError(null)
    setIsLoading(true)
    
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      brandingText="Create new password"
      brandingSubtext="Please enter your new password below."
    >
      <AuthCard>
        {success && <AuthSuccess message="Password updated successfully." />}
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 mx-auto mb-6">
            <KeyRound size={24} strokeWidth={2} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-950 tracking-tight">Set new password</h2>
          <p className="text-[15px] text-slate-500 mt-2">Your new password must be different from previous passwords.</p>
        </div>

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <PasswordField
            label="New password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            error={passwordError}
          />
          
          <PasswordField
            label="Confirm new password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            error={confirmPasswordError}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 mt-4 shadow-md shadow-blue-500/20"
          >
            {isLoading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <Link to="/login" className="text-[14px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Back to Sign in
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}
