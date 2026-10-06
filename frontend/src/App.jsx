import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage    from './pages/DashboardPage'
import UploadPage       from './pages/UploadPage'
import RepositoriesPage from './pages/RepositoriesPage'
import ScansPage        from './pages/ScansPage'
import IssuesPage       from './pages/IssuesPage'
import FixesPage        from './pages/FixesPage'
import ReadmePage       from './pages/ReadmePage'
import PullRequestsPage from './pages/PullRequestsPage'
import DeploymentsPage  from './pages/DeploymentsPage'
import SettingsPage     from './pages/SettingsPage'
import NotFoundPage     from './pages/NotFoundPage'
import LandingPage      from './pages/LandingPage'
import LoginPage        from './pages/LoginPage'
import SignUpPage       from './pages/SignUpPage'
import VerifyEmailPage  from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute   from './components/auth/ProtectedRoute'

/**
 * App — root router for CodeSentinel AI.
 *
 * All authenticated pages are rendered inside DashboardLayout
 * which provides: AnimatedBackground + Sidebar + Topbar + main area.
 *
 * The root path "/" displays the LandingPage.
 */
function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Authenticated app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard"         element={<DashboardPage />} />
          <Route path="upload"            element={<UploadPage />} />
          <Route path="repositories"      element={<RepositoriesPage />} />
          <Route path="scans"             element={<ScansPage />} />
          <Route path="issues"            element={<IssuesPage />} />
          <Route path="fixes"             element={<FixesPage />} />
          <Route path="readme"            element={<ReadmePage />} />
          <Route path="pull-requests"     element={<PullRequestsPage />} />
          <Route path="deployments"       element={<DeploymentsPage />} />
          <Route path="settings"          element={<SettingsPage />} />
          <Route path="*"                 element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
