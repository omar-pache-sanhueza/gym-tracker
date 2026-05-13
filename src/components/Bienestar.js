import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

const INDICADORES = [
  { key: 'sueno', label: 'Sueño' },
  { key: 'energia', label: 'Energía' },
  { key: 'estres', label: 'Estrés', nota: '1 = muy alto · 5 = muy bajo' },
  { key: 'saludArticular', label: 'Salud articular' },
  { key: 'recuperacionMuscular', label: 'Recuperación muscular' },
]

export default function Bienestar({ sugerido, onDone, onBack }) {
  const [valores, setValores] = useState({
    sueno: sugerido?.sueno || 3,
    energia: sugerido?.energia || 3,
    estres: sugerido?.estres || 3,
    saludArticular: sugerido?.saludArticular || 3,
    recuperacionMuscular: sugerido?.recuperacionMuscular || 3,
  })
  const [nota, setNota] = useState(sugerido?.nota || '')

  return html`
    <div class="screen-padded">
      <header class="screen-header">
        <button class="btn-ghost" onClick=${onBack}>← Volver</button>
        <h2 class="screen-header-title">Bienestar pre-entreno</h2>
      </header>

      <div class="bienestar-form">
        ${INDICADORES.map(ind => html`
          <div class="indicador-group">
            <div class="indicador-label-row">
              <span class="indicador-label">${ind.label}</span>
              <span class="indicador-value">${valores[ind.key]}/5</span>
            </div>
            ${ind.nota && html`<p class="indicador-nota">${ind.nota}</p>`}
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
          <span class="indicador-label">Comentario bienestar</span>
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
