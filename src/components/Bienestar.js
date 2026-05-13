import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const ICON_SUENO = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
`

const ICON_MOTIVACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 2l2.39 5.35L20 8.27l-4 4.16.94 5.78L12 15.6 7.06 18.21 8 12.43 4 8.27l5.61-.92L12 2z"/>
    <path d="M12 15.6V22"/>
  </svg>
`

const ICON_ENERGIA = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
`

const ICON_ESTRES = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 3a3.5 3.5 0 0 0-3.5 3.5c0 .4.07.78.2 1.13A3.5 3.5 0 0 0 4 11a3.5 3.5 0 0 0 1.5 2.87V15a3 3 0 0 0 3 3 3 3 0 0 0 3-3V5.5A2.5 2.5 0 0 0 9 3z"/>
    <path d="M15 3a3.5 3.5 0 0 1 3.5 3.5c0 .4-.07.78-.2 1.13A3.5 3.5 0 0 1 20 11a3.5 3.5 0 0 1-1.5 2.87V15a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5.5A2.5 2.5 0 0 1 15 3z"/>
    <path d="M9 8.5h1.5M15 8.5h-1.5M9 12h1.5M15 12h-1.5"/>
  </svg>
`

const ICON_ARTICULAR = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M6 3.5a2.5 2.5 0 0 1 4.6-1.36A2.5 2.5 0 0 1 14.5 4 2.5 2.5 0 0 1 13 6.3v2.2c0 .9.4 1.7 1.1 2.2.9.7 1.4 1.8 1.4 2.9v.8a2.5 2.5 0 0 1-3.9 2.06A2.5 2.5 0 0 1 8 14.4v-.8c0-1.1.5-2.2 1.4-2.9.7-.5 1.1-1.3 1.1-2.2V6.3A2.5 2.5 0 0 1 9 4a2.5 2.5 0 0 1-3-.5z"/>
    <path d="M9 17l-2 4M15 17l2 4"/>
  </svg>
`

const ICON_RECUPERACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 14c2 0 3-1 3-3V8a2 2 0 0 1 4 0v2c2 .5 3.5 2 4 4 .4 1.6-.2 3.3-1.5 4.3-1.4 1-3.2.9-4.5-.3-1-1-2.4-1.5-3.5-1.5H3z"/>
    <path d="M14 11c2 0 3 1 3 3M17 9v6"/>
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
