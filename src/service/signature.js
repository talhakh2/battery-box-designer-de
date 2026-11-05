import { SIGNATURE_ENC } from './signatureData'

function fromB64(s) {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * Try to unlock Engr. Abdullah Farooq's signature with a password.
 * Returns a PNG data URL when the password is correct, otherwise null.
 * (AES-GCM authentication fails on a wrong password, so this doubles as the password check.)
 */
export async function unlockSignature(password) {
  try {
    const enc = new TextEncoder()
    const base = await crypto.subtle.importKey('raw', enc.encode(String(password).trim()), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: fromB64(SIGNATURE_ENC.salt), iterations: SIGNATURE_ENC.iterations, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    )
    const png = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(SIGNATURE_ENC.iv) }, key, fromB64(SIGNATURE_ENC.data))
    const bytes = new Uint8Array(png)
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return `data:image/png;base64,${btoa(bin)}`
  } catch {
    return null
  }
}
