const KEY = 'gym_sesion_v1'

export function saveSession(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearSession() {
  try { localStorage.removeItem(KEY) } catch {}
}
