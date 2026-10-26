import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequestGet } from './today.js'

afterEach(() => vi.unstubAllGlobals())

describe('GET /api/workout/today', () => {
  it('lee la semana desplazada y devuelve sus series por fase', async () => {
    const week4Col = 37
    const week4Row = (...cells) => new Array(week4Col).fill('').concat(cells)
    const rows = [
      week4Row('Semana 4'),
      week4Row('Día 1 - Banca Pesada:', 'lunes 26/10/2026'),
      [],
      week4Row('Orden', 'Ejercicio', 'Series', 'Repeticiones', 'RPE', 'Peso (kg)', 'Descanso entre series (min)'),
      week4Row('1', 'Press banca plano', '5', '1x1 single / 1x2 doble / 3x3 back-offs',
        '7,5-8 / 8 / 7-7,5', '85 / 82 / 73,5', '4'),
    ]
    rows[0][3] = 'Semana 1'
    rows[0][14] = 'Semana 2'
    rows[0][25] = 'Semana 3'
    vi.stubGlobal('fetch', vi.fn(async url => Response.json(
      url.includes('fields=sheets.properties.title')
        ? { sheets: [{ properties: { title: 'Mesociclo 4 Intensificación II' } }] }
        : { values: rows }
    )))

    const response = await onRequestGet({
      request: new Request('https://example.test/api/workout/today?fecha=2026-10-26'),
      env: { GOOGLE_SHEET_ID: 'sheet-id', GOOGLE_SHEETS_API_KEY: 'test-key' },
    })
    const workout = await response.json()

    expect(response.status).toBe(200)
    expect(workout.mesociclo).toBe('Mesociclo 4 Intensificación II')
    expect(workout.ejercicios[0].seriesProgramadas.map(s => s.pesoSugeridoKg)).toEqual([85, 82, 73.5, 73.5, 73.5])

    const restResponse = await onRequestGet({
      request: new Request('https://example.test/api/workout/today?fecha=2026-10-25'),
      env: { GOOGLE_SHEET_ID: 'sheet-id', GOOGLE_SHEETS_API_KEY: 'test-key' },
    })
    const restDay = await restResponse.json()
    expect(restDay.tipo).toBe('descanso')
    expect(restDay.proximo.fecha).toBe('2026-10-26')
  })
})
