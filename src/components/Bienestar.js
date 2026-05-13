import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const ICON_SUENO = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a.6.6 0 0 0-.8-.75A9 9 0 1 0 20.75 15.3a.6.6 0 0 0-.75-.8z"/>
  </svg>
`

const ICON_MOTIVACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 2c1 3 4 4 4 8 0 2-1.2 3.5-2.5 3.5-1 0-1.5-.7-1.5-1.5 0-1 .8-1.7.8-3 0-1-.5-2-1.3-2.7C12 8 11 10 11 12c0 .8-.6 1.5-1.5 1.5C8 13.5 7 12 7 10 7 6 11 4 12 2z"/>
    <path d="M7.5 13.5C6 15 5 16.7 5 18.5A7 7 0 0 0 12 22a7 7 0 0 0 7-3.5c0-1.8-1-3.5-2.5-5"/>
  </svg>
`

const ICON_ENERGIA = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M7 2c.6 1.4 1.8 2 3 2s2.4-.6 3-2"/>
    <path d="M9 4v5.5c0 1-.5 1.5-1.2 2L6 13a3 3 0 0 0 0 4l1.8 1.5c.7.5 1.2 1 1.2 2V22"/>
    <path d="M15 4v5.5c0 1 .5 1.5 1.2 2L18 13a3 3 0 0 1 0 4l-1.8 1.5c-.7.5-1.2 1-1.2 2V22"/>
    <circle cx="12" cy="15" r="2"/>
  </svg>
`

const ICON_RECUPERACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 13c0-1.5 1-3 3-3h2c0-2 1.5-4 4-4 3 0 5 2 5 5 0 1.5-.5 2.5-1.5 3.5"/>
    <path d="M3 13c0 2 1.5 3.5 3.5 3.5 1.5 0 2.5-.8 3.2-2 .5 1 1.5 1.5 2.8 1.5 2 0 3.5-1.5 3.5-3.5"/>
    <path d="M16 14c1.5.5 3 1.5 3 4 0 1.5-1 3-3 3-1.5 0-3-1-3-3"/>
    <path d="M13 18h-3"/>
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
