import { useState, useEffect, useRef } from 'preact/hooks'

/** Segundos transcurridos desde startISO hasta ahora. */
export function useElapsedSeconds(startISO) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startISO) return
    const startMs = new Date(startISO).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    const onVis = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [startISO])
  return elapsed
}

/**
 * Cuenta regresiva basada en reloj de pared: sigue corriendo aunque el
 * navegador suspenda los timers (PWA minimizada en iOS, pestaña en background).
 */
export function useCountdown(initialSecs) {
  // endAt: timestamp ms en que termina el descanso (cuando NO está pausado)
  // pausedRemainingMs: ms restantes cuando está pausado
  const endAtRef = useRef(Date.now() + initialSecs * 1000)
  const pausedRemainingRef = useRef(null)
  const [, force] = useState(0)
  const rerender = () => force(n => n + 1)

  const remainingMs = () => {
    if (pausedRemainingRef.current != null) return pausedRemainingRef.current
    return Math.max(0, endAtRef.current - Date.now())
  }

  useEffect(() => {
    const tick = () => rerender()
    const id = setInterval(tick, 250)
    const onVis = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const secs = Math.ceil(remainingMs() / 1000)
  const paused = pausedRemainingRef.current != null

  return {
    secs: Math.max(0, secs),
    done: remainingMs() <= 0,
    paused,
    pause: () => {
      if (pausedRemainingRef.current != null) return
      pausedRemainingRef.current = Math.max(0, endAtRef.current - Date.now())
      rerender()
    },
    resume: () => {
      if (pausedRemainingRef.current == null) return
      endAtRef.current = Date.now() + pausedRemainingRef.current
      pausedRemainingRef.current = null
      rerender()
    },
    skip: () => {
      endAtRef.current = Date.now()
      pausedRemainingRef.current = null
      rerender()
    },
    add: (n) => {
      const addMs = n * 1000
      if (pausedRemainingRef.current != null) {
        pausedRemainingRef.current = Math.max(0, pausedRemainingRef.current + addMs)
      } else {
        endAtRef.current = endAtRef.current + addMs
      }
      rerender()
    },
  }
}

/** HH:MM:SS */
export function fmtHMS(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60
  const p = n => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(ss)}`
}

/** MM:SS */
export function fmtMS(s) {
  const m = Math.floor(Math.max(0, s) / 60), ss = Math.max(0, s) % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}
