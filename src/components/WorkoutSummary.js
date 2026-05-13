import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

function DebugWebhookButton() {
  const [loading, setLoading] = useState(false)
  const [trace, setTrace] = useState(null)

  async function run(real) {
    setLoading(true); setTrace(null)
    try {
      const url = real ? '/api/debug/test-webhook?real=1' : '/api/debug/test-webhook'
      const res = await fetch(url, { credentials: 'same-origin' })
      setTrace(await res.json())
    } catch (err) {
      setTrace({ ok: false, error: String(err.message || err) })
    } finally {
      setLoading(false)
    }
  }

  return html`
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
      <button class="btn-secondary" style="width:100%" onClick=${() => run(false)} disabled=${loading}>
        ${loading ? 'Probando...' : 'Probar webhook (simple)'}
      </button>
      <button class="btn-secondary" style="width:100%" onClick=${() => run(true)} disabled=${loading}>
        ${loading ? 'Probando...' : 'Probar webhook (payload real)'}
      </button>
      ${trace && html`
        <pre style="
          margin-top:8px;
          background:var(--bg-elev-1);
          border:1px solid var(--border-subtle);
          border-radius:8px;
          padding:10px;
          font-size:11px;
          color:${trace.ok ? 'var(--accent)' : 'var(--danger)'};
          white-space:pre-wrap;
          word-break:break-all;
          max-height:60vh;
          overflow:auto;
        ">${JSON.stringify(trace, null, 2)}</pre>
      `}
    </div>
  `
}

export default function WorkoutSummary({ workout, onStart, onLogout, onSelectDay }) {
  const [showPicker, setShowPicker] = useState(false)

  if (workout.tipo === 'descanso') {
    return html`
      <div class="screen-padded">
        <header class="screen-header">
          <span class="screen-header-title">Gym Tracker</span>
          <button class="btn-ghost" onClick=${onLogout}>Salir</button>
        </header>
        <div class="rest-day">
          <p class="screen-header-meta" style="margin-bottom:12px">${formatDate(todayISO())}</p>
          <span class="rest-day-icon">🛌</span>
          <h2>Hoy es día de descanso</h2>
          ${workout.proximo && html`
            <p class="msg-secondary" style="margin-top:16px;line-height:1.6">
              Próximo entreno:<br/>
              <strong style="color:var(--text-primary)">${workout.proximo.diaNombre}</strong>
              · ${formatDate(workout.proximo.fecha)}
            </p>
          `}
          <button
            class="btn-secondary"
            style="margin-top:24px;width:100%"
            onClick=${() => setShowPicker(p => !p)}
          >${showPicker ? 'Cancelar' : 'Iniciar entrenamiento de otro día'}</button>
          ${showPicker && html`
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
              ${[workout.anterior, workout.proximo].filter(Boolean).map(d => html`
                <button
                  class="btn-secondary"
                  style="width:100%;text-align:left;padding:12px 16px"
                  onClick=${() => onSelectDay(d.fecha)}
                >
                  <span style="color:var(--text-primary);font-weight:500">${d.diaNombre}</span>
                  <span class="msg-secondary" style="margin-left:8px">${formatDate(d.fecha)}</span>
                </button>
              `)}
            </div>
          `}
          <${DebugWebhookButton} />
        </div>
      </div>
    `
  }

  const primeraSerie = workout.ejercicios[0]?.seriesProgramadas[0]

  return html`
    <div class="screen-padded">
      <header class="screen-header">
        <div>
          <p class="screen-header-meta">${workout.mesociclo} · Semana ${workout.semana}</p>
          <h2 class="screen-header-title">Día ${workout.diaNumero} - ${workout.diaNombre}</h2>
        </div>
        <button class="btn-ghost" onClick=${onLogout}>Salir</button>
      </header>

      <div class="exercise-preview-list">
        ${workout.ejercicios.map(ej => {
          const s = ej.seriesProgramadas[0]
          return html`
            <div class="exercise-preview-item">
              <span class="exercise-preview-num">${ej.orden}.</span>
              <div>
                <p class="exercise-preview-name">${ej.nombre}</p>
                <p class="exercise-preview-meta">
                  ${ej.seriesProgramadas.length} series
                  · ${s?.repeticionesProgramadas} repeticiones
                  ${s?.rpeProgramado != null ? ` RPE @${s.rpeProgramado}` : ''}
                  ${s?.pesoSugeridoKg != null ? ` · ${s.pesoSugeridoKg} kg` : ' · peso corporal'}
                </p>
              </div>
            </div>
          `
        })}
      </div>

      <${DebugWebhookButton} />

      <div class="screen-bottom">
        <button class="btn-primary" onClick=${onStart}>Comenzar entrenamiento</button>
      </div>
    </div>
  `
}

function todayISO() {
  return new Date().toLocaleDateString('sv-SE')
}

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`
}
