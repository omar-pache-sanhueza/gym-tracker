import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const ICON_SUENO = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a.6.6 0 0 0-.8-.75A9 9 0 1 0 20.75 15.3a.6.6 0 0 0-.75-.8z"/>
  </svg>
`

const ICON_MOTIVACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2s1.5 3 1.5 5.5c0 1.4-.9 2.3-2 2.3-.9 0-1.6-.6-1.6-1.6 0-.8.4-1.4.4-2.2 0-1-.6-1.9-1.5-2.5-.6 1.7-1.8 3.2-1.8 5.5 0 1.2.4 2.3 1.1 3.1-1.6.8-2.6 2.5-2.6 4.4 0 3 2.8 5.5 6.5 5.5s6.5-2.5 6.5-5.5c0-2.8-1.6-4.8-3.5-6.3-.5 1.5-1.7 2.3-2.7 2.3-1.3 0-2.3-.9-2.3-2.2 0-2 2-3 2-5.5 0-1-.2-1.9-.5-2.8z"/>
  </svg>
`

const ICON_ENERGIA = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13 2 4.5 13.5h6L10 22l9-12h-6l1-8z"/>
  </svg>
`

const ICON_ESTRES = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3a4 4 0 0 0-4 4v.5A3 3 0 0 0 6 13a3 3 0 0 0 1.5 2.6V17a3 3 0 0 0 4.5 2.6"/>
    <path d="M12 3a4 4 0 0 1 4 4v.5A3 3 0 0 1 18 13a3 3 0 0 1-1.5 2.6V17a3 3 0 0 1-4.5 2.6"/>
    <path d="M12 3v17"/>
    <path d="M9 8h1M14 8h1M9 12h1M14 12h1"/>
  </svg>
`

const ICON_ARTICULAR = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 2.4c0-.7.9-1 1.4-.4.6.8 1.5 1.2 2.6 1.2s2-.4 2.6-1.2c.5-.6 1.4-.3 1.4.4 0 1.7-.9 3-2.3 3.5.2.8.3 1.6.3 2.5 0 1.2.4 1.9 1.4 2.6L15 12.4a3.6 3.6 0 0 1 0 5.7l-1.6 1.3c-1 .7-1.4 1.4-1.4 2.6v.5c0 .8-1.2.8-1.2 0v-.5c0-1.6.6-2.7 1.8-3.6l1.6-1.3a2.2 2.2 0 0 0 0-3.5L12.6 12c-1.2-.9-1.8-2-1.8-3.6 0-.7-.1-1.4-.3-2-.1 0-.3 0-.5.1-1.7 0-3.2-.8-4-2.1z"/>
    <circle cx="9.7" cy="14.5" r="2.8"/>
    <path d="M3 14c0-.5.4-.9.9-.9h.6c.5 0 .9.4.9.9s-.4.9-.9.9h-.6c-.5 0-.9-.4-.9-.9z"/>
  </svg>
`

const ICON_RECUPERACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3.5 11.3c-.3-.5-.5-1-.5-1.6 0-1.3 1.1-2.4 2.4-2.4.6 0 1.2.2 1.6.6V6.5C7 4.6 8.6 3 10.5 3c1.4 0 2.6.8 3.2 2 .5-.3 1.1-.5 1.8-.5 1.9 0 3.5 1.6 3.5 3.5 0 .5-.1 1-.3 1.4 1 .6 1.6 1.7 1.6 2.9 0 1.7-1.2 3.1-2.8 3.4-.3 1.7-1.8 3-3.6 3-.8 0-1.6-.3-2.2-.7l-.9 1c-.5.6-1.2.9-2 .9-1.5 0-2.7-1.2-2.7-2.7 0-.4.1-.8.3-1.2-1.4-.5-2.4-1.8-2.4-3.3 0-.7.2-1.3.5-1.9-.4-.4-.5-1-.5-1.5z"/>
  </svg>
`

const INDICADORES = [
  { key: 'sueno', label: 'Sueño', icon: ICON_SUENO },
  { key: 'motivacion', label: 'Motivación', icon: ICON_MOTIVACION },
  { key: 'energia', label: 'Energía', icon: ICON_ENERGIA },
  { key: 'estres', label: 'Estrés', icon: ICON_ESTRES },
  { key: 'saludArticular', label: 'Salud articular', icon: ICON_ARTICULAR },
  { key: 'recuperacionMuscular', label: 'Recuperación muscular', icon: ICON_RECUPERACION },
]

export default function Bienestar({ sugerido, onDone, onBack }) {
  const [valores, setValores] = useState({
    sueno: 5,
    motivacion: 5,
    energia: 5,
    estres: 5,
    saludArticular: 5,
    recuperacionMuscular: 5,
  })
  const [nota, setNota] = useState('')

  return html`
    <div class="screen-padded">
      <header class="screen-header">
        <button class="btn-ghost" onClick=${onBack}>← Volver</button>
        <h2 class="screen-header-title">Bienestar de hoy</h2>
      </header>

      <div class="bienestar-form">
        ${INDICADORES.map(ind => html`
          <div class="indicador-row">
            <span class="indicador-label-wrap">
              ${ind.icon}
              <span class="indicador-label">${ind.label}</span>
            </span>
            <div class="stars-row" role="group" aria-label=${ind.label}>
              ${[1, 2, 3, 4, 5].map(n => html`
                <button
                  type="button"
                  class="star-btn ${n <= valores[ind.key] ? 'filled' : ''}"
                  onClick=${() => setValores(v => ({ ...v, [ind.key]: n }))}
                  aria-label="${n} de 5"
                >★</button>
              `)}
            </div>
          </div>
        `)}

        <div class="indicador-group">
          <span class="indicador-label">Comentario Bienestar:</span>
          <textarea
            class="input-field"
            placeholder="Opcional"
            value=${nota}
            onInput=${e => setNota(e.target.value)}
            rows="2"
            style="margin-top:8px;resize:none"
          />
        </div>
      </div>

      <div class="screen-bottom">
        <button class="btn-primary" onClick=${() => onDone({ ...valores, nota })}>
          Iniciar entrenamiento
        </button>
      </div>
    </div>
  `
}
