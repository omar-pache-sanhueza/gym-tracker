import { getSheetNames, getSheetValues } from '../../lib/sheets.js'
import { findWorkoutInSheet, findAllDatesInSheet } from '../../lib/parser.js'

export async function onRequestGet({ env }) {
  try {
    const today = getDateInSantiago()
    const { validSheets } = await loadMesocicloSheets(env)

    // Buscar entreno de hoy
    for (const { values, name } of validSheets) {
      const workout = findWorkoutInSheet(values, today, name)
      if (workout) return Response.json(workout)
    }

    // Día de descanso: buscar próximo entreno
    const allDates = []
    for (const { values, name } of validSheets) {
      allDates.push(...findAllDatesInSheet(values, name))
    }
    allDates.sort((a, b) => a.fecha.localeCompare(b.fecha))
    const proximo = allDates.find(d => d.fecha > today) || null

    return Response.json({ tipo: 'descanso', proximo })
  } catch (err) {
    console.error('workout/today:', err)
    return Response.json({ error: err.message || 'Error al leer la planilla.' }, { status: 502 })
  }
}

async function loadMesocicloSheets(env) {
  const sheetNames = await getSheetNames(env.GOOGLE_SHEET_ID, env.GOOGLE_SHEETS_API_KEY)
  const mesocicloNames = sheetNames.filter(n => /^Mesociclo/i.test(n) || /^Semana de PR/i.test(n))

  const results = await Promise.allSettled(
    mesocicloNames.map(async name => {
      const values = await getSheetValues(env.GOOGLE_SHEET_ID, name, env.GOOGLE_SHEETS_API_KEY)
      return { name, values }
    })
  )

  const validSheets = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)

  return { validSheets }
}

function getDateInSantiago() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' })
}
