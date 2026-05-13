import { getSheetNames, getSheetValues } from '../../lib/sheets.js'
import { findWorkoutInSheet } from '../../lib/parser.js'

export async function onRequestGet({ request, env }) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'Parámetro date inválido. Usar formato YYYY-MM-DD.' }, { status: 400 })
  }

  try {
    const sheetNames = await getSheetNames(env.GOOGLE_SHEET_ID, env.GOOGLE_SHEETS_API_KEY)
    const mesocicloNames = sheetNames.filter(n => /^Mesociclo/i.test(n) || /^Semana de PR/i.test(n))

    for (const name of mesocicloNames) {
      try {
        const values = await getSheetValues(env.GOOGLE_SHEET_ID, name, env.GOOGLE_SHEETS_API_KEY)
        const workout = findWorkoutInSheet(values, date, name)
        if (workout) return Response.json(workout)
      } catch {
        // hoja mal formada, ignorar (RNF-10)
      }
    }

    return Response.json({ error: 'No hay entreno programado para esa fecha.' }, { status: 404 })
  } catch (err) {
    console.error('workout/by-date:', err)
    return Response.json({ error: 'Error al leer la planilla.' }, { status: 502 })
  }
}
