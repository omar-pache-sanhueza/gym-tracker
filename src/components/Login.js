import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

export default function Login({ onSuccess, serverError }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (res.ok) onSuccess()
      else setError(data.error || 'Error al iniciar sesión.')
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const displayError = error || serverError

  return html`
    <div class="screen-center">
      <div class="login-box">
        <div class="login-logo">
          <span class="login-logo-icon">💪</span>
          <h1>Gym Tracker</h1>
        </div>
        <form onSubmit=${handleSubmit}>
          <input
            class="input-field"
            type="password"
            placeholder="Di, amigo, y entra"
            value=${password}
            onInput=${e => setPassword(e.target.value)}
            autocomplete="current-password"
            autofocus
          />
          ${displayError && html`<p class="msg-error" style="margin-top:8px">${displayError}</p>`}
          <button
            class="btn-primary"
            type="submit"
            disabled=${loading || !password}
            style="margin-top:16px"
          >${loading ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  `
}
