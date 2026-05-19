// Audio helper para el beep de fin de descanso.
// En iOS Safari el AudioContext debe crearse y "desbloquearse" desde un gesto
// del usuario. Pre-agendamos la oscilación con Web Audio para que suene aunque
// los timers de JS estén suspendidos (PWA en background, pantalla apagada).

let ctx = null

function getCtx() {
  if (ctx) return ctx
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

/** Llamar desde un gesto del usuario para desbloquear audio en iOS. */
export function unlockAudio() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  // Reproducir un buffer silencioso para desbloquear definitivamente en iOS.
  try {
    const buf = c.createBuffer(1, 1, 22050)
    const src = c.createBufferSource()
    src.buffer = buf
    src.connect(c.destination)
    src.start(0)
  } catch {}
}

function scheduleBeepAt(startTime) {
  const c = getCtx()
  if (!c) return null
  if (c.state === 'suspended') c.resume().catch(() => {})

  // Tres pitidos cortos para que se note.
  const stops = []
  const beep = (offset, freq = 880) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, startTime + offset)
    gain.gain.exponentialRampToValueAtTime(0.4, startTime + offset + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + offset + 0.25)
    osc.start(startTime + offset)
    osc.stop(startTime + offset + 0.3)
    stops.push(osc)
  }
  beep(0, 880)
  beep(0.35, 880)
  beep(0.7, 1175)

  return () => {
    stops.forEach(o => { try { o.stop(0) } catch {} })
  }
}

/** Agenda el beep dentro de `secs` segundos. Devuelve función para cancelar. */
export function scheduleBeepIn(secs) {
  const c = getCtx()
  if (!c) return () => {}
  return scheduleBeepAt(c.currentTime + Math.max(0, secs)) || (() => {})
}

/** Reproduce el beep inmediatamente. */
export function beepNow() {
  const c = getCtx()
  if (!c) return
  scheduleBeepAt(c.currentTime + 0.01)
}

export function vibrate() {
  try { navigator.vibrate?.([100, 100, 200]) } catch {}
}
