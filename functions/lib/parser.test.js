import { describe, it, expect } from 'vitest'
import { parseRestSeconds, parseDayHeader, findWorkoutInSheet, findAllDatesInSheet } from './parser.js'

// Fixture que emula lo que devuelve la Google Sheets API (valores formateados,
// arreglos 0-indexados desde la columna A) para una hoja en el formato nuevo
// (Mesociclo 3 Fuerza en adelante): fecha en celda contigua, columna Tonelaje,
// descanso en minutos como número, comentario en weekCol+8 y esquema top/back-off.
const weekCol = 3
const pad = (...cells) => {
  const row = new Array(weekCol).fill('')
  return row.concat(cells)
}

const SHEET = [
  pad('Semana 1'),                                                                 // 0: fila de semana
  pad('Día 1 - Piernas A:', 'lunes 22/06/2026'),                                   // 1: título + fecha en celda contigua
  pad(''),                                                                          // 2: bienestar (vacío en formato nuevo)
  pad('Orden', 'Ejercicio', 'Series', 'Repeticiones', 'RPE', 'Peso (kg)',
      'Descanso entre series (min)', 'Tonelaje (kg)', 'Comentarios del ejercicio'),// 3: encabezados
  pad('1', 'Sentadilla libre (barra baja)', '4', '5 top / 7 back-off', '7,5',
      '70 / 62,5', '4', '787,5', 'Aproximaciones: barra 20×8 / 40×5 -'),           // 4: top/back-off
  pad('2', 'Crunch abdominal', '3', '30', '—', '—', '1', '—', ''),                 // 5: peso corporal
  pad('3', 'Plancha lateral', '3', '60 seg / lado', '—', '—', '1', '—', ''),       // 6: "/" que NO es top/back-off
  pad('Duración sesión incluído calentamiento (min):', '0', 'RPE global:', '7,5'), // 7: cierre
]

describe('parseRestSeconds', () => {
  it('parsea minutos y segundos con sufijo', () => {
    expect(parseRestSeconds(' 2 min')).toBe(120)
    expect(parseRestSeconds('1,5 min')).toBe(90)
    expect(parseRestSeconds('30 s')).toBe(30)
  })
  it('trata un número desnudo como minutos (columna "(min)" del formato nuevo)', () => {
    expect(parseRestSeconds('4')).toBe(240)
    expect(parseRestSeconds('2,5')).toBe(150)
  })
  it('usa 60 s por defecto cuando está vacío o es ilegible', () => {
    expect(parseRestSeconds('')).toBe(60)
    expect(parseRestSeconds(null)).toBe(60)
  })
})

describe('parseDayHeader', () => {
  it('extrae día sin fecha inline (formato nuevo)', () => {
    expect(parseDayHeader('Día 1 - Piernas A:')).toEqual({ date: null, diaNumero: 1, diaNombre: 'Piernas A' })
  })
  it('extrae fecha inline si está presente (formato viejo)', () => {
    expect(parseDayHeader('Día 2 - Torso A:  Lunes 30/03/2026'))
      .toEqual({ date: '2026-03-30', diaNumero: 2, diaNombre: 'Torso A' })
  })
})

describe('findAllDatesInSheet', () => {
  it('resuelve la fecha desde la celda contigua al título', () => {
    expect(findAllDatesInSheet(SHEET, 'Mesociclo 3 Fuerza')).toEqual([
      { fecha: '2026-06-22', diaNumero: 1, diaNombre: 'Piernas A', mesociclo: 'Mesociclo 3 Fuerza' },
    ])
  })
})

describe('findWorkoutInSheet (formato nuevo)', () => {
  const wd = findWorkoutInSheet(SHEET, '2026-06-22', 'Mesociclo 3 Fuerza')

  it('encuentra el día por la fecha de la celda contigua', () => {
    expect(wd).not.toBeNull()
    expect(wd.fecha).toBe('2026-06-22')
    expect(wd.diaNombre).toBe('Piernas A')
    expect(wd.rpeGlobalSugerido).toBe(7.5)
  })

  it('expande top/back-off: serie 1 = izquierda del "/", resto = derecha', () => {
    const s = wd.ejercicios[0].seriesProgramadas
    expect(s).toHaveLength(4)
    expect(s[0]).toMatchObject({ numero: 1, repeticionesProgramadas: 5, pesoSugeridoKg: 70 })
    expect(s[1]).toMatchObject({ numero: 2, repeticionesProgramadas: 7, pesoSugeridoKg: 62.5 })
    expect(s[3]).toMatchObject({ repeticionesProgramadas: 7, pesoSugeridoKg: 62.5 })
  })

  it('pre-carga el comentario de la planilla solo en la serie 1', () => {
    const s = wd.ejercicios[0].seriesProgramadas
    expect(s[0].comentarioSugerido).toBe('Aproximaciones: barra 20×8 / 40×5 -')
    expect(s[1].comentarioSugerido).toBe('')
  })

  it('lee el comentario desde weekCol+8 (no desde Tonelaje en weekCol+7)', () => {
    expect(wd.ejercicios[0].seriesProgramadas[0].comentarioSugerido).not.toContain('787')
  })

  it('lee descanso en minutos desde número desnudo', () => {
    expect(wd.ejercicios[0].seriesProgramadas[0].descansoPrescritoSeg).toBe(240)
  })

  it('marca peso corporal (—) como null', () => {
    const crunch = wd.ejercicios[1].seriesProgramadas[0]
    expect(crunch.pesoSugeridoKg).toBeNull()
    expect(crunch.rpeProgramado).toBeNull()
  })

  it('no divide "60 seg / lado" como si fuera top/back-off', () => {
    const plancha = wd.ejercicios[2].seriesProgramadas
    expect(plancha[0].repeticionesProgramadas).toBe('60 seg / lado')
    expect(plancha[1].repeticionesProgramadas).toBe('60 seg / lado')
  })
})

// Snapshot de la hoja real "Mesociclo 3 Fuerza II" (arranca el 27/07/2026).
// Respecto a "Mesociclo 3 Fuerza" el formato agrega: fila de bienestar con
// valores (5×6) en vez de vacía, narrativa en columnas A/B (Objetivo,
// Principios, Plan) a la izquierda del bloque de semana, y filas de cierre con
// "Tonelaje de la sesión (kg):" y "sRPE en unidades arbitrarias (UA):". Ninguno
// rompe el parseo, pero el snapshot lo blinda (regla #6 de AGENTS.md).
// `col` coloca celdas por índice explícito para poder poblar las columnas A/B.
const col = map => {
  const max = Math.max(...Object.keys(map).map(Number))
  const r = new Array(max + 1).fill('')
  for (const [k, v] of Object.entries(map)) r[k] = v
  return r
}

const SHEET_M3F2 = [
  col({ 0: 'Mesociclo 3', 1: 'Fuerza II', 3: 'Semana 1' }),
  col({ 0: 'Duración', 1: '5 semanas', 3: 'Día 1 - Banca Pesada', 4: 'lunes 27/07/2026',
        5: 'Calidad del Sueño', 6: 'Motivación', 7: 'Energía', 8: 'Nivel de Estrés',
        9: 'Salud articular', 10: 'Recuperación muscular', 11: 'Comentarios pre entreno' }),
  col({ 0: 'Objetivo', 1: 'Consolidar la oleada 2 de fuerza',
        5: '5', 6: '5', 7: '5', 8: '5', 9: '5', 10: '5' }),
  col({ 3: 'Orden', 4: 'Ejercicio', 5: 'Series', 6: 'Repeticiones', 7: 'RPE', 8: 'Peso (kg)',
        9: 'Descanso entre series (min)', 10: 'Tonelaje (kg)', 11: 'Comentarios del ejercicio' }),
  col({ 3: '1', 4: 'Press banca plano', 5: '4', 6: '5 top / 5 back-off', 7: '8', 8: '77,5 / 70',
        9: '4', 10: '1437,5', 11: 'Aproximaciones: barra 20×10 / 40×5 / 55×3 / 70×1 - ' }),
  col({ 3: '2', 4: 'Remo gironda', 5: '4', 6: '6', 7: '8', 8: '77,6', 9: '2,5', 10: '1862,4' }),
  col({ 0: 'Principios', 1: '+2,5 kg en principales',
        3: '3', 4: 'Facepulls', 5: '3', 6: '15', 7: '8', 8: '32,2', 9: '2,5', 10: '1449' }),
  col({ 3: '4', 4: 'Elevaciones laterales', 5: '2', 6: '15', 7: '8', 8: '7,5', 9: '2,5', 10: '225' }),
  col({ 3: 'Duración sesión incluído calentamiento (min):', 4: '0', 5: 'RPE global:', 6: '8',
        8: 'Tonelaje de la sesión (kg):', 10: '4973,9',
        11: 'sRPE en unidades arbitrarias (UA):', 12: '0' }),
  col({ 3: 'Comentarios post entreno:' }),
  col({ 0: 'Plan', 1: 'Sem 1-3: oleada 2 (RPE 8 → 9)' }),
  // Día 2: casos de peso corporal, duración como reps y "/ lado" no top/back-off.
  col({ 3: 'Día 2 - Sentadilla Pesada', 4: 'martes 28/07/2026',
        5: 'Calidad del Sueño', 6: 'Motivación', 7: 'Energía', 8: 'Nivel de Estrés',
        9: 'Salud articular', 10: 'Recuperación muscular', 11: 'Comentarios pre entreno' }),
  col({ 5: '5', 6: '5', 7: '5', 8: '5', 9: '5', 10: '5' }),
  col({ 3: 'Orden', 4: 'Ejercicio', 5: 'Series', 6: 'Repeticiones', 7: 'RPE', 8: 'Peso (kg)',
        9: 'Descanso entre series (min)', 10: 'Tonelaje (kg)', 11: 'Comentarios del ejercicio' }),
  col({ 3: '1', 4: 'Sentadilla libre (barra baja)', 5: '4', 6: '5 top / 5 back-off', 7: '8',
        8: '77,5 / 70', 9: '4', 10: '1437,5', 11: 'Stance cerrado' }),
  col({ 3: '2', 4: 'Plancha frontal', 5: '2', 6: '1 min', 7: '—', 8: '—', 9: '1', 10: '—' }),
  col({ 3: '3', 4: 'Press Pallof', 5: '2', 6: '10 / lado', 7: '—', 8: '—', 9: '1', 10: '—' }),
  col({ 3: 'Duración sesión incluído calentamiento (min):', 4: '0', 5: 'RPE global:', 6: '8' }),
]

describe('findWorkoutInSheet (hoja real Mesociclo 3 Fuerza II)', () => {
  it('lista ambos días con fecha y nombre correctos', () => {
    expect(findAllDatesInSheet(SHEET_M3F2, 'Mesociclo 3 Fuerza II')).toEqual([
      { fecha: '2026-07-27', diaNumero: 1, diaNombre: 'Banca Pesada', mesociclo: 'Mesociclo 3 Fuerza II' },
      { fecha: '2026-07-28', diaNumero: 2, diaNombre: 'Sentadilla Pesada', mesociclo: 'Mesociclo 3 Fuerza II' },
    ])
  })

  it('parsea el Día 1 sin dejarse confundir por la narrativa ni la fila sRPE', () => {
    const wd = findWorkoutInSheet(SHEET_M3F2, '2026-07-27', 'Mesociclo 3 Fuerza II')
    expect(wd.diaNombre).toBe('Banca Pesada')
    expect(wd.ejercicios).toHaveLength(4)
    // "sRPE en unidades arbitrarias (UA):" NO debe capturarse como RPE global.
    expect(wd.rpeGlobalSugerido).toBe(8)
    // El ejercicio con texto en columnas A/B ("Principios") se parsea igual.
    expect(wd.ejercicios[2].nombre).toBe('Facepulls')
    const top = wd.ejercicios[0].seriesProgramadas
    expect(top[0]).toMatchObject({ repeticionesProgramadas: 5, pesoSugeridoKg: 77.5, descansoPrescritoSeg: 240 })
    expect(top[1]).toMatchObject({ repeticionesProgramadas: 5, pesoSugeridoKg: 70 })
    expect(top[0].comentarioSugerido).not.toContain('1437')
  })

  it('parsea el Día 2: peso corporal (—), duración como reps y "/ lado" sin dividir', () => {
    const wd = findWorkoutInSheet(SHEET_M3F2, '2026-07-28', 'Mesociclo 3 Fuerza II')
    const plancha = wd.ejercicios[1].seriesProgramadas
    expect(plancha[0].repeticionesProgramadas).toBe('1 min')
    expect(plancha[0].pesoSugeridoKg).toBeNull()
    const pallof = wd.ejercicios[2].seriesProgramadas
    expect(pallof[0].repeticionesProgramadas).toBe('10 / lado')
    expect(pallof[1].repeticionesProgramadas).toBe('10 / lado')
  })
})
