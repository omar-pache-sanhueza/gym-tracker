import { render, h } from 'preact'
import { useState } from 'preact/hooks'
import { html } from 'htm/preact'
import './styles.css'

function Login({ onSuccess }) {
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
      })
      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Error al iniciar sesión.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

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
            placeholder="Di amigo y entra"
            value=${password}
            onInput=${e => setPassword(e.target.value)}
            autocomplete="current-password"
            autofocus
          />
          ${error && html`<p class="msg-error" style="margin-top:8px">${error}</p>`}
          <button
            class="btn-primary"
            type="submit"
            disabled=${loading || !password}
            style="margin-top:16px"
          >
            ${loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  `
}

function Dashboard({ onLogout }) {
  return html`
    <div class="screen-center">
      <div class="login-box">
        <p style="color:var(--accent);font-size:18px;font-weight:600;text-align:center">
          ✓ Sesión iniciada
        </p>
        <p class="msg-secondary">Frontend en construcción — Fase 2.</p>
        <button class="btn-secondary" onClick=${onLogout}>Cerrar sesión</button>
      </div>
    </div>
  `
}

function App() {
  const [authenticated, setAuthenticated] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthenticated(false)
  }

  return authenticated
    ? html`<${Dashboard} onLogout=${logout} />`
    : html`<${Login} onSuccess=${() => setAuthenticated(true)} />`
}

render(h(App, null), document.getElementById('app'))
