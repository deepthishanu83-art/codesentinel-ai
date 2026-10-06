const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * Authentication Service Layer
 */
export const authService = {
  async loginWithGitHub() {
    console.info('[CodeSentinel Auth] Redirecting to GitHub OAuth: GET /api/github/login')
    window.location.href = `${API_BASE}/api/github/login`
    return new Promise(() => {}) // pending forever since it redirects
  },

  async loginWithEmail(email, password) {
    throw new Error('Email login is not implemented in this version.')
  },

  async signUpWithEmail(name, email, password) {
    throw new Error('Sign up is not implemented in this version.')
  },

  async verifyEmail(token) {
    throw new Error('Email verification is not implemented in this version.')
  },

  async resendVerification(email) {
    throw new Error('Resend verification is not implemented.')
  },

  async forgotPassword(email) {
    throw new Error('Forgot password is not implemented.')
  },

  async resetPassword(token, newPassword) {
    throw new Error('Reset password is not implemented.')
  },

  async logout() {
    console.info(`[CodeSentinel Auth] POST /auth/logout`)
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
    return { success: true }
  },

  async getAuthenticatedUser() {
    console.info(`[CodeSentinel Auth] GET /auth/me`)
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      })
      if (!res.ok) {
        return null
      }
      const data = await res.json()
      return data
    } catch (e) {
      return null
    }
  }
}
