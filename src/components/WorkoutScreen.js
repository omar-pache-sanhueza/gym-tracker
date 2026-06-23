import { html } from 'htm/preact'
import { useState, useEffect, useRef } from 'preact/hooks'
import { useElapsedSeconds, useCountdown, fmtHMS, fmtMS } from '../lib/timer.js'
import { scheduleBeepIn, beepNow, unlockAudio, vibrate } from '../lib/audio.js'

function firstIncomplete(ejercicios) {
  return ejercicios.findIndex(ej => !ej.series.every(s => s.completada))
}

function initEjercicios(workout) {
  return workout.ejercicios.map(ej => ({
    orden: ej.orden,
    nombre: ej.nombre,
    rpeEjercicio: ej.seriesProgramadas[0]?.rpeProgramado ?? null,
    series: ej.seriesProgramadas.map(s => ({
      numero: s.numero,
      reps: typeof s.repeticionesProgramadas === 'string'
        ? (parseInt(s.repeticionesProgramadas) || 1)
        : (s.repeticionesProgramadas || 1),
      rpeProgramado: s.rpeProgramado,
      pesoKg: s.pesoSugeridoKg,
      esPesoCorporal: s.pesoSugeridoKg === null,
      descansoPrescritoSeg: s.descansoPrescritoSeg,
      // Comentario propio de cada serie; el de la planilla pre-carga la serie 1.
      comentario: s.comentarioSugerido || '',
      completada: false,
      completadoEn: null,
    })),
  }))
}

// Steppers de reps/intensidad/peso, compartidos por la serie activa y la edición
// de una serie ya completada. Componente estable (definido fuera del render) para
// que el textarea hermano no pierda foco entre tipeos.
function SerieSteppers({ serie, onReps, onPeso }) {
  return html`
    <div class="serie-field">
      <span class="serie-field-label">Repeticiones</span>
      <div class="stepper">
        <button type="button" class="stepper-btn"
          onClick=${() => onReps(Math.max(1, serie.reps - 1))}>−</button>
        <span class="stepper-value">${serie.reps}</span>
        <button type="button" class="stepper-btn"
          onClick=${() => onReps(serie.reps + 1)}>+</button>
      </div>
    </div>

    ${serie.rpeProgramado != null && html`
      <div class="serie-field">
        <span class="serie-field-label">Intensidad</span>
        <span class="serie-field-value">RPE @${serie.rpeProgramado}</span>
      </div>
    `}

    <div class="serie-field">
      <span class="serie-field-label">${serie.esPesoCorporal ? 'Peso' : 'Peso sugerido'}</span>
      ${serie.esPesoCorporal
        ? html`<span class="serie-field-value">peso corporal</span>`
        : html`
          <div class="stepper">
            <button type="button" class="stepper-btn"
              onClick=${() => onPeso(Math.max(0, (serie.pesoKg || 0) - 2.5))}>−</button>
            <span class="stepper-value">${serie.pesoKg ?? 0} kg</span>
            <button type="button" class="stepper-btn"
              onClick=${() => onPeso((serie.pesoKg || 0) + 2.5)}>+</button>
          </div>
        `}
    </div>
  `
}

export default function WorkoutScreen({ workout, inicioISO, savedEjercicios, onDone, onSave, onLogout }) {
  const [ejercicios, setEjercicios] = useState(() => savedEjercicios || initEjercicios(workout))
  // Clave `${ejIdx}-${serieIdx}` de la serie completada que se está reeditando, o null.
  const [editKey, setEditKey] = useState(null)
  const [selectedEjIdx, setSelectedEjIdx] = useState(() => {
    const base = savedEjercicios || initEjercicios(workout)
    const idx = firstIncomplete(base)
    return idx >= 0 ? idx : 0
  })
  const [rest, setRest] = useState(null)
  const wakeLockRef = useRef(null)
  const activeSerieRef = useRef(null)

  function scrollActiveIntoView() {
    setTimeout(() => {
      activeSerieRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }
  const elapsed = useElapsedSeconds(inicioISO)

  // Wake lock
  useEffect(() => {
    const acquire = async () => {
      try { wakeLockRef.current = await navigator.wakeLock.request('screen') } catch {}
    }
    acquire()
    const onVisible = () => { if (!document.hidden && !wakeLockRef.current) acquire() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      wakeLockRef.current?.release()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Persistir tras cada cambio
  useEffect(() => { onSave?.(ejercicios) }, [ejercicios])

  // Auto-avanzar al ejercicio incompleto de menor índice cuando el seleccionado termina
  useEffect(() => {
    const sel = ejercicios[selectedEjIdx]
    if (sel && sel.series.every(s => s.completada)) {
      const next = firstIncomplete(ejercicios)
      if (next >= 0) setSelectedEjIdx(next)
    }
  }, [ejercicios])

  const allDone = firstIncomplete(ejercicios) === -1

  function updateSerie(ejIdx, serieIdx, updates) {
    setEjercicios(prev => prev.map((ej, ei) =>
      ei !== ejIdx ? ej : {
        ...ej,
        series: ej.series.map((s, si) => si !== serieIdx ? s : { ...s, ...updates }),
      }
    ))
  }

  function updateEjercicio(ejIdx, updates) {
    setEjercicios(prev => prev.map((ej, ei) => ei !== ejIdx ? ej : { ...ej, ...updates }))
  }

  function handleSerieDone(ejIdx, serieIdx) {
    unlockAudio()
    const ej = ejercicios[ejIdx]
    const serie = ej.series[serieIdx]
    const desc = serie.descansoPrescritoSeg

    const last = {
      ejercicio: ej.nombre,
      numero: serie.numero,
      reps: serie.reps,
      pesoKg: serie.esPesoCorporal ? null : serie.pesoKg,
    }

    let next = null
    const nextSerieSameEj = ej.series.find((s, i) => i > serieIdx && !s.completada)
    if (nextSerieSameEj) {
      next = {
        ejercicio: ej.nombre,
        numero: nextSerieSameEj.numero,
        reps: nextSerieSameEj.reps,
        pesoKg: nextSerieSameEj.esPesoCorporal ? null : nextSerieSameEj.pesoKg,
      }
    } else {
      for (let i = 0; i < ejercicios.length; i++) {
        if (i === ejIdx) continue
        const pending = ejercicios[i].series.find(s => !s.completada)
        if (pending) {
          next = {
            ejercicio: ejercicios[i].nombre,
            numero: pending.numero,
            reps: pending.reps,
            pesoKg: pending.esPesoCorporal ? null : pending.pesoKg,
          }
          break
        }
      }
    }

    updateSerie(ejIdx, serieIdx, { completada: true, completadoEn: new Date().toISOString() })
    setRest({ secs: desc, key: `${ejIdx}-${serieIdx}`, last, next })
  }

  function handleFinish() {
    onDone(ejercicios.map(ej => ({
      orden: ej.orden,
      nombre: ej.nombre,
      rpeEjercicio: ej.rpeEjercicio,
      series: ej.series.map(s => ({
        numero: s.numero,
        reps: s.reps,
        rpeProgramado: s.rpeProgramado,
        pesoKg: s.esPesoCorporal ? null : s.pesoKg,
        descansoPrescritoSeg: s.descansoPrescritoSeg,
        comentario: s.comentario || '',
        completadoEn: s.completadoEn || new Date().toISOString(),
      })),
    })))
  }

  return html`
    <div class="screen-workout">
      <header class="workout-header">
        <span class="workout-timer">${fmtHMS(elapsed)}</span>
        <span class="workout-header-day">Día ${workout.diaNumero} - ${workout.diaNombre}</span>
        <button class="btn-ghost small" onClick=${onLogout}>Salir</button>
      </header>

      <div class="workout-content">
        ${ejercicios.map((ej, ejIdx) => {
          const isSelected = ejIdx === selectedEjIdx
          const isDone = ej.series.every(s => s.completada)
          const isIncomplete = !isDone && !isSelected
          const activeSerieIdx = isSelected ? ej.series.findIndex(s => !s.completada) : -1

          return html`
            <div
              class="exercise-card ${isSelected ? 'active' : ''} ${isDone ? 'done' : ''}"
              style=${isIncomplete ? 'cursor:pointer' : ''}
              onClick=${isIncomplete ? () => setSelectedEjIdx(ejIdx) : undefined}
            >
              <div class="exercise-card-header">
                <span class="exercise-num">${ej.orden}.</span>
                <span class="exercise-name">${ej.nombre}</span>
                ${isDone
                  ? html`<span class="exercise-done-check">✓</span>`
                  : isIncomplete
                    ? html`<span style="color:var(--text-tertiary);font-size:12px">Toca para ir aquí</span>`
                    : null
                }
              </div>

              ${(isSelected || isDone) && html`
                <div class="series-list">
                  ${ej.series.map((serie, serieIdx) => {
                    const isActiveSerie = isSelected && serieIdx === activeSerieIdx
                    const isEditing = serie.completada && !isActiveSerie && editKey === `${ejIdx}-${serieIdx}`
                    return html`
                      <div class="serie-row ${serie.completada ? 'done' : ''} ${isActiveSerie ? 'active' : ''}" ref=${isActiveSerie ? activeSerieRef : null}>
                        ${isActiveSerie ? html`
                          <div class="serie-active-block">
                            <div class="serie-active-header">
                              <span class="serie-active-title">Serie ${serie.numero}</span>
                              <span class="serie-active-total">de ${ej.series.length}</span>
                            </div>

                            <${SerieSteppers}
                              serie=${serie}
                              onReps=${reps => updateSerie(ejIdx, serieIdx, { reps })}
                              onPeso=${pesoKg => updateSerie(ejIdx, serieIdx, { pesoKg })}
                            />

                            <div class="serie-field">
                              <span class="serie-field-label">Descanso</span>
                              <span class="serie-field-value">${fmtMS(serie.descansoPrescritoSeg)} minutos</span>
                            </div>

                            <textarea
                              class="input-field"
                              placeholder="Comentario de la serie (opcional)"
                              value=${serie.comentario}
                              onInput=${e => updateSerie(ejIdx, serieIdx, { comentario: e.target.value })}
                              rows="2"
                              style="resize:none"
                            />

                            <button
                              type="button"
                              class="btn-primary"
                              style="margin-top:8px"
                              onClick=${() => handleSerieDone(ejIdx, serieIdx)}
                            >Serie completada</button>
                          </div>
                        ` : isEditing ? html`
                          <div class="serie-active-block">
                            <div class="serie-active-header">
                              <span class="serie-active-title">Serie ${serie.numero}</span>
                              <span class="serie-active-total">de ${ej.series.length}</span>
                            </div>

                            <${SerieSteppers}
                              serie=${serie}
                              onReps=${reps => updateSerie(ejIdx, serieIdx, { reps })}
                              onPeso=${pesoKg => updateSerie(ejIdx, serieIdx, { pesoKg })}
                            />

                            <textarea
                              class="input-field"
                              placeholder="Comentario de la serie (opcional)"
                              value=${serie.comentario}
                              onInput=${e => updateSerie(ejIdx, serieIdx, { comentario: e.target.value })}
                              rows="2"
                              style="resize:none"
                            />

                            <button
                              type="button"
                              class="btn-secondary"
                              style="margin-top:8px"
                              onClick=${() => setEditKey(null)}
                            >Listo</button>
                          </div>
                        ` : html`
                          <span class="serie-label">Serie ${serie.numero}</span>
                          ${serie.completada ? html`
                            <span class="serie-done-data">
                              ${serie.reps} repeticiones
                              ${serie.rpeProgramado != null ? html` <span class="rpe-badge">RPE @${serie.rpeProgramado}</span>` : ''}
                              ${!serie.esPesoCorporal && serie.pesoKg != null ? html` · ${serie.pesoKg} kg` : ''}
                              ${serie.esPesoCorporal ? html` · peso corporal` : ''}
                            </span>
                            <span class="serie-check">✓</span>
                            <button type="button" class="btn-ghost small serie-edit-btn"
                              onClick=${() => setEditKey(`${ejIdx}-${serieIdx}`)}>Editar</button>
                          ` : html`
                            <span class="serie-pending-data">
                              ${serie.reps} repeticiones
                              ${serie.rpeProgramado != null ? ` RPE @${serie.rpeProgramado}` : ''}
                              ${!serie.esPesoCorporal && serie.pesoKg != null ? ` · ${serie.pesoKg} kg` : ''}
                            </span>
                          `}
                          ${serie.comentario ? html`<span class="serie-comment">${serie.comentario}</span>` : ''}
                        `}
                      </div>
                    `
                  })}

                  ${isDone && ej.rpeEjercicio !== null && html`
                    <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
                      <div class="stepper-group">
                        <span class="stepper-label">RPE del ejercicio</span>
                        <div class="stepper">
                          <button type="button" class="stepper-btn"
                            onClick=${() => updateEjercicio(ejIdx, { rpeEjercicio: Math.max(1, ej.rpeEjercicio - 0.5) })}>−</button>
                          <span class="stepper-value">${String(ej.rpeEjercicio).replace('.', ',')}</span>
                          <button type="button" class="stepper-btn"
                            onClick=${() => updateEjercicio(ejIdx, { rpeEjercicio: Math.min(10, ej.rpeEjercicio + 0.5) })}>+</button>
                        </div>
                      </div>
                    </div>
                  `}
                </div>
              `}
            </div>
          `
        })}

        ${allDone && html`
          <button class="btn-primary" style="margin-top:24px;flex-shrink:0" onClick=${handleFinish}>
            Finalizar sesión
          </button>
        `}

        <div style="height:32px"></div>
      </div>

      ${rest && html`
        <${RestOverlay}
          key=${rest.key}
          secs=${rest.secs}
          last=${rest.last}
          next=${rest.next}
          onClose=${() => { setRest(null); scrollActiveIntoView() }}
        />
      `}
    </div>
  `
}

function RestOverlay({ secs, last, next, onClose }) {
  const cd = useCountdown(secs)
  const firedRef = useRef(false)

  // Pre-agenda el beep con Web Audio cada vez que cambia endAt (resume/+30s/skip).
  // En pausa (endAt = null) se cancela hasta que se reanude.
  useEffect(() => {
    if (cd.endAt == null) return
    const remaining = Math.max(0, (cd.endAt - Date.now()) / 1000)
    if (remaining <= 0) return
    const cancel = scheduleBeepIn(remaining)
    return cancel
  }, [cd.endAt])

  // Vibración (solo Android) y respaldo de beep cuando el timer llega a 0
  // mientras la app está visible. Se dispara una sola vez.
  useEffect(() => {
    if (cd.done && !firedRef.current) {
      firedRef.current = true
      vibrate()
      if (!document.hidden) beepNow()
    }
  }, [cd.done])

  const serieLine = (s) => {
    const peso = s.pesoKg !== null && s.pesoKg !== undefined ? `${s.pesoKg} kg` : 'peso corporal'
    return `Serie ${s.numero}: ${s.reps} reps · ${peso}`
  }

  return html`
    <div class="rest-overlay">
      ${last ? html`
        <div class="rest-context rest-context-last">
          <p class="rest-context-label">Última serie</p>
          <p class="rest-context-ej">${last.ejercicio}</p>
          <p class="rest-context-detail">${serieLine(last)}</p>
        </div>
      ` : html`<div></div>`}

      <div class="rest-center">
        <p class="rest-title">Descanso</p>
        <div class="rest-timer ${cd.done ? 'blink' : ''}">${fmtMS(cd.secs)}</div>
        <div class="rest-actions">
          <button class="btn-secondary" onClick=${() => cd.add(30)}>+30s</button>
          <button class="btn-secondary" onClick=${cd.paused ? cd.resume : cd.pause}>
            ${cd.paused ? 'Reanudar' : 'Pausa'}
          </button>
          <button class="btn-secondary" onClick=${onClose}>Terminar</button>
        </div>
      </div>

      ${next ? html`
        <div class="rest-context rest-context-next">
          <p class="rest-context-label">Siguiente</p>
          <p class="rest-context-ej">${next.ejercicio}</p>
          <p class="rest-context-detail">${serieLine(next)}</p>
        </div>
      ` : html`
        <div class="rest-context rest-context-next">
          <p class="rest-context-label">Siguiente</p>
          <p class="rest-context-detail">Última serie del día</p>
        </div>
      `}
    </div>
  `
}
