import { useState, useEffect } from 'preact/hooks'

/** Segundos transcurridos desde startISO hasta ahora. */
export function useElapsedSeconds(startISO) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startISO) return
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startISO).getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startISO])
  return elapsed
}

/** Cuenta regresiva desde initialSecs. */
export function useCountdown(initialSecs) {
  const [secs, setSecs] = useState(initialSecs)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || secs <= 0) return
    const id = setTimeout(() => setSecs(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [secs, paused])

  return {
    secs: Math.max(0, secs),
    done: secs <= 0,
    paused,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    skip: () => setSecs(0),
    add: (n) => setSecs(s => s + n),
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
