import { useState } from 'react'
import { unlockSignature } from './signature'

export function PasswordDialog({ title, message, confirmLabel = 'Confirm', onSuccess, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!password) { setError('Enter the password.'); return }
    setBusy(true)
    setError('')
    try {
      const signature = await unlockSignature(password)
      if (signature) onSuccess(signature)
      else { setError('Incorrect password.'); setPassword('') }
    } catch {
      setError('Could not check the password. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="srModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="srPwTitle" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <form className="srModal" onSubmit={submit}>
        <div className="srModalIcon" aria-hidden="true">🔒</div>
        <div className="srModalTitle" id="srPwTitle">{title}</div>
        {message && <div className="srModalMsg">{message}</div>}
        <div className="loginFieldWrap">
          <input
            className={`loginInput${error ? ' loginInputError' : ''}`}
            type={show ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            autoFocus
          />
          <button type="button" className="loginTogglePw" onClick={() => setShow(v => !v)} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? '🙈' : '👁'}
          </button>
        </div>
        {error && <div className="loginError">{error}</div>}
        <div className="srModalActions">
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="primaryBtn" disabled={busy}>{busy ? 'Checking…' : confirmLabel}</button>
        </div>
      </form>
    </div>
  )
}
