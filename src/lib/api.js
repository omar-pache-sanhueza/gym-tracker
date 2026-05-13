export async function getWorkoutToday(fecha) {
  const url = fecha ? `/api/workout/today?fecha=${fecha}` : '/api/workout/today'
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Error ${res.status} al leer la planilla.`)
  }
  return res.json()
}

export async function submitWorkout(sesion) {
  const res = await fetch('/api/workout/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sesion),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al enviar el resumen.')
  return data
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
}
