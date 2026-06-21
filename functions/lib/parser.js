/**
 * Parsea string/número de descanso a segundos.
 * "2 min" → 120, "1,5 min" → 90, "30 s" → 30.
 * La columna "Descanso entre series (min)" del formato nuevo entrega un número
 * desnudo en minutos ("4" → 240, "2,5" → 150).
 * @param {string|number} str
 * @returns {number}
 */
export function parseRestSeconds(str) {
  if (str === null || str === undefined || str === '') return 60
  const s = String(str).trim().replace(',', '.')
  if (!s) return 60
  const minMatch = s.match(/([\d.]+)\s*min/i)
  if (minMatch) return Math.round(parseFloat(minMatch[1]) * 60)
  const secMatch = s.match(/([\d.]+)\s*s/i)
  if (secMatch) return Math.round(parseFloat(secMatch[1]))
  // Número desnudo: la columna "(min)" lo entrega en minutos.
  const bare = parseFloat(s)
  if (!isNaN(bare)) return Math.round(bare * 60)
  return 60
}

/**
 * Extrae una fecha ISO YYYY-MM-DD de un texto con patrón DD/MM/AAAA.
 * Sirve tanto para la celda de fecha dedicada del formato nuevo
 * ("lunes 22/06/2026") como para el encabezado inline del formato viejo.
 * @param {string} str
 * @returns {string | null}
 */
function parseSheetDate(str) {
  const m = String(str || '').match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Parsea encabezado de día: "Día 1 - Piernas A:" (formato nuevo, sin fecha)
 * o "Día 1 - Piernas A:  Lunes 11/05/2026" (formato viejo, fecha inline).
 * @param {string} str
 * @returns {{ date: string | null, diaNumero: number, diaNombre: string } | null}
 */
export function parseDayHeader(str) {
  if (!str || typeof str !== 'string') return null
  const diaMatch = str.match(/D[íi]a\s+(\d+)\s*[-–]\s*([^:]+)/i)
  if (!diaMatch) return null
  return {
    date: parseSheetDate(str),
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
      const row = values[rowIdx] || []
      const dayInfo = parseDayHeader(String(row[weekCol] || ''))
      if (!dayInfo) continue
      // En el formato nuevo la fecha vive en la celda contigua (weekCol+1).
      const date = dayInfo.date || parseSheetDate(row[weekCol + 1])
      if (!date || date !== targetDate) continue
      dayInfo.date = date

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
      const row = values[rowIdx] || []
      const dayInfo = parseDayHeader(String(row[weekCol] || ''))
      if (!dayInfo) continue
      const date = dayInfo.date || parseSheetDate(row[weekCol + 1])
      if (!date) continue
      results.push({ fecha: date, diaNumero: dayInfo.diaNumero, diaNombre: dayInfo.diaNombre, mesociclo: mesocicloName })
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

  // Buscar RPE global sugerido en las filas de cierre (tras los ejercicios).
  // Está junto a la etiqueta "RPE global:" y puede ser decimal (ej. 7,5).
  const closeStart = headerRow + 3 + exercises.length
  let rpeGlobalSugerido
  for (let r = closeStart; r < Math.min(closeStart + 4, values.length); r++) {
    const closeRow = values[r] || []
    for (let c = weekCol; c < Math.min(weekCol + 11, closeRow.length); c++) {
      if (/RPE\s*global/i.test(String(closeRow[c] || ''))) {
        const val = parseFloat(String(closeRow[c + 1] || '').replace(',', '.'))
        if (!isNaN(val) && val >= 1 && val <= 10) rpeGlobalSugerido = val
        break
      }
    }
    if (rpeGlobalSugerido !== undefined) break
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

const isDash = v => v === '-' || v === '—' || v === ''

/**
 * Parte un valor con esquema "izquierda / derecha" (top / back-off).
 * "70 / 62,5" → ['70', '62,5']; "5 top / 7 back-off" → ['5 top', '7 back-off'].
 * @param {string} raw
 * @returns {[string, string] | null}
 */
function splitSlash(raw) {
  const s = String(raw)
  const idx = s.indexOf('/')
  if (idx === -1) return null
  return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()]
}

/** Primer número dentro de un token ("5 top" → 5, "62,5" → 62.5). */
function firstNumber(token) {
  const m = String(token).replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

/** Reps a nivel de ejercicio: número simple, o string si es rango/duración ("8-10", "60 seg"). */
function parseReps(repsRaw) {
  return repsRaw.includes('-') || isNaN(Number(repsRaw)) ? repsRaw : parseInt(repsRaw)
}

/** Peso simple a número o null si es peso corporal / "-". */
function parsePeso(pesoRaw) {
  if (isDash(pesoRaw)) return null
  const n = parseFloat(String(pesoRaw).replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseExercises(values, startRow, weekCol) {
  const exercises = []
  for (let r = startRow; r < Math.min(startRow + 10, values.length); r++) {
    const row = values[r] || []
    const ordenRaw = String(row[weekCol] || '').trim()
    const nombre = String(row[weekCol + 1] || '').trim()

    if (!ordenRaw || !nombre || !/^\d+$/.test(ordenRaw)) continue

    const numSeries = parseInt(row[weekCol + 2]) || 1
    const repsRaw = String(row[weekCol + 3] || '').trim()
    const rpeRaw = String(row[weekCol + 4] || '').trim()
    const pesoRaw = String(row[weekCol + 5] || '').trim()
    const descansoRaw = row[weekCol + 6]
    // weekCol + 7 = Tonelaje (agregado de carga; se ignora por diseño)
    const comentario = String(row[weekCol + 8] || '').trim()

    const rpeParsed = isDash(rpeRaw) ? null : parseFloat(rpeRaw.replace(',', '.'))
    const descansoSeg = parseRestSeconds(descansoRaw)

    // Esquema top / back-off: la fila representa series con cargas distintas.
    // Serie 1 toma el valor a la izquierda del "/"; las siguientes el de la derecha.
    const esTopBackoff = /top/i.test(repsRaw) && /back/i.test(repsRaw)
    const repsSplit = esTopBackoff ? splitSlash(repsRaw) : null
    const pesoSplit = esTopBackoff ? splitSlash(pesoRaw) : null

    const repsFor = i => {
      if (repsSplit) {
        const n = firstNumber(i === 0 ? repsSplit[0] : repsSplit[1])
        return n != null ? n : repsRaw
      }
      return parseReps(repsRaw)
    }
    const pesoFor = i => {
      if (pesoSplit) {
        const n = firstNumber(i === 0 ? pesoSplit[0] : pesoSplit[1])
        return n != null ? n : null
      }
      return parsePeso(pesoRaw)
    }

    exercises.push({
      orden: parseInt(ordenRaw),
      nombre,
      seriesProgramadas: Array.from({ length: numSeries }, (_, i) => ({
        numero: i + 1,
        repeticionesProgramadas: repsFor(i),
        rpeProgramado: (rpeParsed !== null && !isNaN(rpeParsed)) ? rpeParsed : null,
        pesoSugeridoKg: pesoFor(i),
        descansoPrescritoSeg: descansoSeg,
        // El comentario pre-asignado de la planilla pre-carga la primera serie.
        comentarioSugerido: i === 0 ? comentario : '',
      })),
    })
  }
  return exercises
}
