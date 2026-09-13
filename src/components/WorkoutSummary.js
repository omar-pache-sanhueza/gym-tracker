import { html } from 'htm/preact'
import { useState } from 'preact/hooks'

export default function WorkoutSummary({ workout, onStart, onLogout, onSelectDay }) {
  const [showPicker, setShowPicker] = useState(false)

  if (workout.tipo === 'descanso') {
    return html`
      <div class="screen-padded rest-day-screen">
        <header class="screen-header">
          <span class="screen-header-title">Gym Tracker</span>
          <button class="btn-ghost" onClick=${onLogout}>Salir</button>
        </header>
        <div class="rest-day">
          <p class="rest-day-date">${formatDate(todayISO())}</p>
          <span class="rest-day-icon">🛌</span>
          <h2>Hoy es día de descanso</h2>
          ${workout.proximo && html`
            <p class="rest-day-next">
              <span>Próximo entrenamiento</span>
              <strong>${workout.proximo.diaNombre}</strong>
              <span>${formatDate(workout.proximo.fecha)}</span>
            </p>
          `}
          <button
            class="btn-secondary"
            style="margin-top:24px;width:100%"
            onClick=${() => setShowPicker(p => !p)}
          >${showPicker ? 'Cancelar' : 'Iniciar entrenamiento de otro día'}</button>
          ${showPicker && html`
            <div class="rest-day-picker">
              ${[workout.anterior, workout.proximo].filter(Boolean).map(d => html`
                <button
                  class="btn-secondary rest-day-option"
                  onClick=${() => onSelectDay(d.fecha)}
                >
                  <span class="rest-day-option-name">${d.diaNombre}</span>
                  <span class="rest-day-option-date">${formatDate(d.fecha)}</span>
                </button>
              `)}
            </div>
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
