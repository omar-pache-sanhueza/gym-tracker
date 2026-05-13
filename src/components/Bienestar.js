import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const SVG_ATTRS = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'

const ICON_SUENO = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a.6.6 0 0 0-.8-.75A9 9 0 1 0 20.75 15.3a.6.6 0 0 0-.75-.8z"/>
  </svg>
`

const ICON_MOTIVACION = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="13" r="8"/>
    <circle cx="11" cy="13" r="4.5"/>
    <circle cx="11" cy="13" r="1.4" fill="currentColor"/>
    <path d="M14 10 21 3"/>
    <path d="M17 3h4v4"/>
  </svg>
`

const ICON_ENERGIA = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="4" width="12" height="17" rx="2"/>
    <path d="M10 2.5h4"/>
    <path d="M13 8 10 14h3l-1 4 3-6h-3l1-4z" fill="currentColor" stroke="none"/>
  </svg>
`

const ICON_ESTRES = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 4.5a3 3 0 0 0-3 3 2.7 2.7 0 0 0-1.8 4.7A3 3 0 0 0 5 17.5 3 3 0 0 0 9 20a2.5 2.5 0 0 0 2.5-2.5V7a2.5 2.5 0 0 0-2.5-2.5z"/>
    <path d="M7 11.5c.7-.3 1.3-1 1.5-1.7"/>
    <path d="M7.5 15c.7.3 1.5.3 2.2 0"/>
    <path d="M16 4 14 8h2.5L15 12l3-4h-2.5L17 4z" fill="currentColor" stroke="none"/>
    <path d="M20 11l-1.5 2.5H20L19 16"/>
  </svg>
`

const ICON_ARTICULAR = html`
  <svg class="indicador-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 2c0 1.5.5 2.7 1.5 3.5C11.5 6.2 12 7 12 8.5V10"/>
    <path d="M15 2c0 1.5-.5 2.7-1.5 3.5C12.5 6.2 12 7 12 8.5"/>
    <circle cx="12" cy="12.5" r="3"/>
    <path d="M9 22c0-1.5.5-2.7 1.5-3.5 1-.7 1.5-1.5 1.5-3v-1"/>
    <path d="M15 22c0-1.5-.5-2.7-1.5-3.5-1-.7-1.5-1.5-1.5-3"/>
  </svg>
`

const ICON_RECUPERACION = html`<span class="indicador-icon indicador-icon-emoji" aria-hidden="true">💪</span>`

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
