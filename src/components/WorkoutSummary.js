import { html } from 'htm/preact'

export default function WorkoutSummary({ workout, onStart, onLogout }) {
  if (workout.tipo === 'descanso') {
    return html`
      <div class="screen-padded">
        <header class="screen-header">
          <span class="screen-header-title">Gym Tracker</span>
          <button class="btn-ghost" onClick=${onLogout}>Salir</button>
        </header>
        <div class="rest-day">
          <span class="rest-day-icon">🛌</span>
          <h2>Hoy es día de descanso</h2>
          ${workout.proximo && html`
            <p class="msg-secondary" style="margin-top:16px;line-height:1.6">
              Próximo entreno:<br/>
              <strong style="color:var(--text-primary)">${workout.proximo.diaNombre}</strong>
              · ${formatDate(workout.proximo.fecha)}
            </p>
          `}
        </div>
      </div>
    `
  }

  const primeraSerie = workout.ejercicios[0]?.seriesProgramadas[0]

  return html`
    <div class="screen-padded">
      <header class="screen-header">
        <div>
          <p class="screen-header-meta">${workout.mesociclo} · Sem. ${workout.semana}</p>
          <h2 class="screen-header-title">Día ${workout.diaNumero} — ${workout.diaNombre}</h2>
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
                  · ${s?.repeticionesProgramadas} reps
                  ${s?.rpeProgramado != null ? ` @ RPE${s.rpeProgramado}` : ''}
                  ${s?.pesoSugeridoKg != null ? ` · ${s.pesoSugeridoKg} kg` : ' · peso corporal'}
                </p>
              </div>
            </div>
          `
        })}
      </div>

      <div class="screen-bottom">
        <button class="btn-primary" onClick=${onStart}>Comenzar entrenamiento</button>
      </div>
    </div>
  `
}

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
}
