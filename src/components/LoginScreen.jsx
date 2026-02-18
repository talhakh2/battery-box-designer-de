import { useState } from 'react'
import bcrypt from 'bcryptjs'

// bcrypt hash of the access password (password itself is never stored)
const PASSWORD_HASH = '$2b$12$MkMGf7qz.h9UXf7/ldBHWeSwbPkvq.DfOzFgdoCBDXJ4gQKxkZvQq'
const SESSION_KEY   = 'de_auth_v1'
const DISPLAY_NAME  = 'Engr. Abdullah'

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function LoginScreen({ onSuccess }) {
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showPw, setShowPw]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) { setError('Please enter the password.'); return }
    setLoading(true)
    setError('')
    try {
      const match = await bcrypt.compare(password, PASSWORD_HASH)
      if (match) {
        sessionStorage.setItem(SESSION_KEY, '1')
        onSuccess()
      } else {
        setError('Incorrect password. Please try again.')
        setPassword('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginOverlay">
      <div className="loginCard">

        {/* Welcome */}
        <div className="loginWelcome">
          <div className="loginGreeting">Welcome back,</div>
          <div className="loginName">{DISPLAY_NAME}</div>
          <div className="loginHint">Enter your password to access the Battery Box Designer.</div>
        </div>

        {/* Form */}
        <form className="loginForm" onSubmit={handleSubmit}>
          <div className="loginFieldWrap">
            <input
              className={`loginInput${error ? ' loginInputError' : ''}`}
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              className="loginTogglePw"
              onClick={() => setShowPw(v => !v)}
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>

          {error && <div className="loginError">{error}</div>}

          <button
            type="submit"
            className="loginBtn"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Access Application'}
          </button>
        </form>

      </div>
    </div>
  )
}
