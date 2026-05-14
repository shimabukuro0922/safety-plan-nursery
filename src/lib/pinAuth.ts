/**
 * PIN authentication utilities
 * - SHA-256 hashing via Web Crypto API (no external dependencies)
 * - sessionStorage for verification state (automatically clears on tab close)
 */

/** Hash a PIN string with SHA-256. Returns lowercase hex string. */
export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Verify a plaintext PIN against a stored SHA-256 hash. */
export async function verifyPIN(pin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPIN(pin)
  return hash === storedHash
}

const SESSION_PREFIX = 'pin_verified_'

/** Mark this facility's PIN as verified for the current browser session. */
export function markPINVerified(facilityKey: string): void {
  sessionStorage.setItem(`${SESSION_PREFIX}${facilityKey}`, '1')
}

/** Check whether the PIN has been verified in the current session. */
export function isPINVerified(facilityKey: string): boolean {
  return sessionStorage.getItem(`${SESSION_PREFIX}${facilityKey}`) === '1'
}

/** Clear PIN verification (use after PIN change or removal). */
export function clearPINVerified(facilityKey: string): void {
  sessionStorage.removeItem(`${SESSION_PREFIX}${facilityKey}`)
}
