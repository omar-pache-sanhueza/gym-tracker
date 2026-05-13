import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

function formatDuration(secs) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

export default function FinishScreen({ sesionData, onSubmit, loading, error }) {
  const [rpe, setRpe] = useState(sesionData.rpeGlobalSugerido || 7)
  const [comentario, setComentario] = useState('')

  return html`
    <div class="screen-padded">
      <header class="screen-header">
        <h2 class="screen-header-title">Finalizar sesión</h2>
      </header>

      <div class="finish-section">
        <p class="finish-label">Duración registrada</p>
        <p class="finish-duration">${formatDuration(sesionData.duracionTotalSeg)}</p>
      </div>

      <div class="finish-section">
        <div class="rpe-header-row">
          <span class="finish-label">RPE general del día</span>
          <span class="rpe-big-value">${String(rpe).replace('.', ',')}</span>
        </div>
        <input
          type="range"
          class="rpe-slider"
          min="1" max="10" step="0.5"
          value=${rpe}
          onInput=${e => setRpe(parseFloat(e.target.value))}
        />
        <div class="rpe-marks"><span>1</span><span>10</span></div>
      </div>

      <div class="finish-section">
        <p class="finish-label">Comentario general del día</p>
        <textarea
          class="input-field"
          placeholder="Opcional"
          value=${comentario}
          onInput=${e => setComentario(e.target.value)}
          rows="3"
          style="margin-top:8px;resize:none"
        />
      </div>

      <div class="finish-section">
        <p class="finish-label">Resumen de ejercicios</p>
        <div style="margin-top:8px">
          ${sesionData.ejerciciosEjecutados.map(ej => html`
            <p class="summary-exercise-line">
              ${ej.orden}. ${ej.nombre}
              <span class="msg-secondary"> · ${ej.series.length} series</span>
            </p>
          `)}
        </div>
      </div>

      ${error && html`<p class="msg-error" style="margin-bottom:12px">${error}</p>`}

      <div class="screen-bottom">
        <button
          class="btn-primary"
          onClick=${() => onSubmit(rpe, comentario)}
          disabled=${loading}
        >${loading ? 'Enviando…' : 'Finalizar entrenamiento y enviar'}</button>
      </div>
    </div>
  `
}
