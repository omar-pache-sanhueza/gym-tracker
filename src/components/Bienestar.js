import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const emoji = (char) => html`<span class="indicador-icon indicador-icon-emoji" aria-hidden="true">${char}</span>`

const ICON_SUENO = emoji('😴')
const ICON_MOTIVACION = emoji('🎯')
const ICON_ENERGIA = emoji('⚡')
const ICON_ESTRES = emoji('🧠')
const ICON_ARTICULAR = emoji('🦴')
const ICON_RECUPERACION = emoji('💪')

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
