import { useState } from 'react'
import { ENGINEER_NAME, fmtDate } from './readings'

export function nowText() {
  const d = new Date()
  const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return `${fmtDate(iso)} ${t}`
}

/**
 * Role + verification state with the password prompt, shared by both reports.
 * Returns state plus handlers; render `dialog` somewhere in the tab.
 */
export function useSignOff({ addToast, techNameRef }) {
  const [role, setRole] = useState('technician')
  const [verified, setVerified] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState('')
  const [signature, setSignature] = useState(null)
  const [pwPrompt, setPwPrompt] = useState(null) // 'engineer' | 'verify' | null

  const chooseRole = (r) => {
    if (r === 'engineer') {
      if (signature) setRole('engineer')
      else setPwPrompt('engineer')
    } else {
      setRole('technician')
      window.requestAnimationFrame(() => techNameRef.current?.focus())
    }
  }

  const onPasswordOk = (sig) => {
    setSignature(sig)
    if (pwPrompt === 'engineer') {
      setRole('engineer')
      addToast(`Engineer mode: ${ENGINEER_NAME}`, 'success')
    } else if (pwPrompt === 'verify') {
      setVerified(true)
      setVerifiedAt(nowText())
      addToast('Report verified — signature added', 'success')
    }
    setPwPrompt(null)
  }

  const toggleVerify = () => {
    if (verified) { setVerified(false); setVerifiedAt(''); return }
    setPwPrompt('verify')
  }

  const resetVerify = () => { setVerified(false); setVerifiedAt('') }

  return {
    role, verified, verifiedAt, signature, pwPrompt, setPwPrompt,
    chooseRole, onPasswordOk, toggleVerify, resetVerify,
  }
}
