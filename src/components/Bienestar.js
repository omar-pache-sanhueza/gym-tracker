import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const ICON_SUENO = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a.6.6 0 0 0-.8-.75A9 9 0 1 0 20.75 15.3a.6.6 0 0 0-.75-.8z"/>
  </svg>
`

const ICON_MOTIVACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-5.39-2.59-10.2-6.5-13.33zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
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
    <path d="M8 1.4c-.9 0-1.6.7-1.6 1.6 0 .6.3 1.1.8 1.4-.5.3-.8.8-.8 1.4 0 .9.7 1.6 1.6 1.6h.4v4.8c-1.4.4-2.4 1.7-2.4 3.2 0 .9.4 1.7 1 2.3-.6.6-1 1.4-1 2.3 0 1.5 1 2.8 2.4 3.2v.4c0 .9.7 1.6 1.6 1.6.6 0 1.1-.3 1.4-.8.3.5.8.8 1.4.8.9 0 1.6-.7 1.6-1.6 0-.6-.3-1.1-.8-1.4.5-.3.8-.8.8-1.4 0-.9-.7-1.6-1.6-1.6h-.4v-4.8c1.4-.4 2.4-1.7 2.4-3.2 0-.9-.4-1.7-1-2.3.6-.6 1-1.4 1-2.3 0-1.5-1-2.8-2.4-3.2V2.4c0-.9-.7-1.6-1.6-1.6-.6 0-1.1.3-1.4.8-.3-.5-.8-.8-1.4-.8z"/>
  </svg>
`

const ICON_RECUPERACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <ellipse cx="9" cy="11" rx="6" ry="4.2"/>
    <rect x="3" y="13" width="13" height="6" rx="3"/>
    <rect x="14" y="2" width="5.5" height="12" rx="2.7"/>
    <rect x="14.5" y="1" width="4.5" height="1.5" rx="0.7"/>
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
