import { useState } from 'react'
import bcrypt from 'bcryptjs'
import { BatteryHero } from './BatteryHero'
import { Disclaimer } from './Disclaimer'

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
    <div className="loginOverlay themeBg">
      <div className="themeOrb themeOrb1" aria-hidden="true" />
      <div className="themeOrb themeOrb2" aria-hidden="true" />
      <div className="themeGrid" aria-hidden="true" />

      <div className="loginShell">
        <section className="loginHero">
          <div className="loginBrandRow">
            <img src="/af-logo.svg" alt="Battery Field Service" className="loginBrandLogo" />
            <span className="loginKicker">Field Service Toolkit</span>
          </div>
          <h1 className="loginHeadline">
            Battery &amp; Charger<br /><span>Field Service</span>, made simple.
          </h1>
          <p className="loginLead">Design battery boxes, record cell readings, report charger faults and issue parts — right from site, on your phone.</p>
          <div className="loginArt"><BatteryHero /></div>
          <div className="loginChips">
            <span>📦 Box Designer</span><span>🔋 Battery Report</span><span>🔌 Charger Report</span><span>🧰 Parts Issue</span>
          </div>
        </section>

        <div className="loginCard">
          <div className="loginWelcome">
            <div className="loginGreeting">Welcome back,</div>
            <div className="loginName">{DISPLAY_NAME}</div>
            <div className="loginHint">Enter your password to open the Field Service Toolkit.</div>
          </div>

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

            <button type="submit" className="loginBtn" disabled={loading}>
              {loading ? 'Verifying…' : 'Access Application'}
            </button>
          </form>

          <Disclaimer compact />
        </div>
      </div>
    </div>
  )
}
