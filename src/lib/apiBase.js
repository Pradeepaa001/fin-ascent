/**
 * API origin for browser fetches.
 * - If NEXT_PUBLIC_API_BASE_URL is set, use it (absolute URL).
 * - Otherwise use same-origin relative paths so Next.js can proxy to FastAPI (see next.config.mjs).
 *   This fixes "pending forever" when the browser cannot reach localhost:8000 (e.g. WSL vs Windows).
 */
export function getApiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  if (raw == null || String(raw).trim() === '') {
    return ''
  }
  return String(raw).replace(/\/$/, '')
}

/** e.g. '' or 'http://localhost:8000' */
export function getDashboardApiBase() {
  const o = getApiOrigin()
  return o ? `${o}/api/dashboard` : '/api/dashboard'
}

export function getBackendApiBase() {
  const o = getApiOrigin()
  return o || ''
}

/** Same-origin path when origin is empty (Next rewrites), else absolute. */
export function backendUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  const o = getApiOrigin()
  return o ? `${o}${p}` : p
}

/** fetch with timeout (AbortSignal.timeout is not everywhere). */
export function fetchWithTimeout(url, init = {}, timeoutMs = 30_000) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  return fetch(url, { ...init, signal: ac.signal }).finally(() => clearTimeout(t))
}
