import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!user) {
    // Not logged in -> Redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // A GitHub OAuth user has a 'login' field from the GitHub API.
  // All GitHub OAuth users are considered verified.
  // Email-only signup is not implemented in this version.
  const isGitHubUser = Boolean(user?.login)
  if (!isGitHubUser && !user?.emailVerified) {
    // Logged in but email not verified -> Redirect to verify email
    return <Navigate to="/verify-email" state={{ email: user.email }} replace />
  }

  // Logged in and verified -> Render children via Outlet
  return <Outlet />
}
