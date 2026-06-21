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
