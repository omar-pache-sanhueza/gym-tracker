/**
 * Parsea string de descanso a segundos.
 * "2 min" → 120, "1,5 min" → 90, "30 s" → 30
 * @param {string} str
 * @returns {number}
 */
export function parseRestSeconds(str) {
  if (!str) return 60
  const s = str.trim().replace(',', '.')
  const minMatch = s.match(/([\d.]+)\s*min/i)
  if (minMatch) return Math.round(parseFloat(minMatch[1]) * 60)
  const secMatch = s.match(/([\d.]+)\s*s/i)
  if (secMatch) return Math.round(parseFloat(secMatch[1]))
  return 60
}

/**
 * Parsea encabezado de día: "Día 1 - Piernas A:  Lunes 11/05/2026"
 * @param {string} str
 * @returns {{ date: string, diaNumero: number, diaNombre: string } | null}
 */
export function parseDayHeader(str) {
  if (!str || typeof str !== 'string') return null
  const dateMatch = str.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!dateMatch) return null
  const [, dd, mm, yyyy] = dateMatch
  const diaMatch = str.match(/D[íi]a\s+(\d+)\s*[-–]\s*([^:]+)/i)
  if (!diaMatch) return null
  return {
    date: `${yyyy}-${mm}-${dd}`,
    diaNumero: parseInt(diaMatch[1]),
    diaNombre: diaMatch[2].split(':')[0].trim(),
  }
}

/**
 * Encuentra el entreno de una fecha en una hoja de mesociclo.
 * Escanea todas las filas buscando encabezados de día en las columnas de semana.
 * @param {string[][]} values
 * @param {string} targetDate - YYYY-MM-DD
 * @param {string} mesocicloName
 * @returns {import('./types').WorkoutDay | null}
 */
export function findWorkoutInSheet(values, targetDate, mesocicloName) {
  if (!values || values.length < 3) return null

  const weekCols = findWeekCols(values)

  for (const { col: weekCol, semana } of weekCols) {
    for (let rowIdx = 1; rowIdx < values.length; rowIdx++) {
      const cell = String((values[rowIdx] || [])[weekCol] || '')
      const dayInfo = parseDayHeader(cell)
      if (!dayInfo || dayInfo.date !== targetDate) continue

      return buildWorkoutDay(values, rowIdx, weekCol, semana, mesocicloName, dayInfo)
    }
  }

  return null
}

/**
 * Devuelve todas las fechas con entreno en una hoja.
 * @param {string[][]} values
 * @param {string} mesocicloName
 * @returns {Array<{ fecha: string, diaNumero: number, diaNombre: string, mesociclo: string }>}
 */
export function findAllDatesInSheet(values, mesocicloName) {
  if (!values || values.length < 2) return []
  const results = []
  const weekCols = findWeekCols(values)

  for (const { col: weekCol } of weekCols) {
    for (let rowIdx = 1; rowIdx < values.length; rowIdx++) {
      const cell = String((values[rowIdx] || [])[weekCol] || '')
      const dayInfo = parseDayHeader(cell)
      if (dayInfo) results.push({ fecha: dayInfo.date, diaNumero: dayInfo.diaNumero, diaNombre: dayInfo.diaNombre, mesociclo: mesocicloName })
    }
  }

  return results
}

// --- helpers internos ---

function findWeekCols(values) {
  const row0 = values[0] || []
  const cols = []

  // Buscar "Semana N" en incrementos de 11 columnas desde col 3 (1-indexed col 4)
  for (let col = 3; col < row0.length; col += 11) {
    const match = String(row0[col] || '').match(/Semana\s+(\d+)/i)
    if (match) cols.push({ col, semana: parseInt(match[1]) })
  }

  // Fallback: búsqueda lineal si la planilla no empieza exactamente en col 3
  if (cols.length === 0) {
    for (let col = 0; col < row0.length; col++) {
      const match = String(row0[col] || '').match(/Semana\s+(\d+)/i)
      if (match) cols.push({ col, semana: parseInt(match[1]) })
    }
  }

  return cols
}

function buildWorkoutDay(values, headerRow, weekCol, semana, mesocicloName, dayInfo) {
  const bienestarRow = values[headerRow + 1] || []
  // headerRow+2 = encabezados de tabla (se omite)
  const exercises = parseExercises(values, headerRow + 3, weekCol)

  // Buscar RPE global sugerido en las filas de cierre (tras los ejercicios)
  const closeStart = headerRow + 3 + exercises.length
  let rpeGlobalSugerido
  for (let r = closeStart; r < Math.min(closeStart + 4, values.length); r++) {
    const closeRow = values[r] || []
    for (let c = weekCol; c < Math.min(weekCol + 11, closeRow.length); c++) {
      const val = parseFloat(String(closeRow[c] || '').replace(',', '.'))
      if (!isNaN(val) && Number.isInteger(val) && val >= 1 && val <= 10) {
        rpeGlobalSugerido = val
        break
      }
    }
    if (rpeGlobalSugerido) break
  }

  return {
    fecha: dayInfo.date,
    mesociclo: mesocicloName,
    semana,
    diaNumero: dayInfo.diaNumero,
    diaNombre: dayInfo.diaNombre,
    bienestarSugerido: {
      sueno: 3,
      energia: 3,
      estres: 3,
      saludArticular: 3,
      recuperacionMuscular: 3,
      nota: String(bienestarRow[weekCol] || '').trim(),
    },
    ejercicios: exercises,
    ...(rpeGlobalSugerido !== undefined ? { rpeGlobalSugerido } : {}),
  }
}

function parseExercises(values, startRow, weekCol) {
  const exercises = []
  for (let r = startRow; r < Math.min(startRow + 8, values.length); r++) {
    const row = values[r] || []
    const ordenRaw = String(row[weekCol] || '').trim()
    const nombre = String(row[weekCol + 1] || '').trim()

    if (!ordenRaw || !nombre || !/^\d+$/.test(ordenRaw)) continue

    const numSeries = parseInt(row[weekCol + 2]) || 1
    const repsRaw = String(row[weekCol + 3] || '').trim()
    const rpeRaw = String(row[weekCol + 4] || '').trim()
    const pesoRaw = String(row[weekCol + 5] || '').trim()
    const descansoRaw = String(row[weekCol + 6] || '').trim()
    const comentario = String(row[weekCol + 7] || '').trim()

    const isDash = v => v === '-' || v === '-' || v === ''
    const rpeParsed = isDash(rpeRaw) ? null : parseFloat(rpeRaw)
    const pesoParsed = isDash(pesoRaw) ? null : parseFloat(pesoRaw.replace(',', '.'))
    const repsValue = repsRaw.includes('-') || isNaN(Number(repsRaw))
      ? repsRaw
      : parseInt(repsRaw)

    exercises.push({
      orden: parseInt(ordenRaw),
      nombre,
      seriesProgramadas: Array.from({ length: numSeries }, (_, i) => ({
        numero: i + 1,
        repeticionesProgramadas: repsValue,
        rpeProgramado: (rpeParsed !== null && !isNaN(rpeParsed)) ? rpeParsed : null,
        pesoSugeridoKg: (pesoParsed !== null && !isNaN(pesoParsed)) ? pesoParsed : null,
        descansoPrescritoSeg: parseRestSeconds(descansoRaw),
      })),
      comentarioSugerido: comentario,
    })
  }
  return exercises
}
