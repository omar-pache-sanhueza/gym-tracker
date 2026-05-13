const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

/**
 * @param {string} sheetId
 * @param {string} apiKey
 * @returns {Promise<string[]>}
 */
export async function getSheetNames(sheetId, apiKey) {
  const url = `${API_BASE}/${sheetId}?key=${apiKey}&fields=sheets.properties.title`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.sheets.map(s => s.properties.title)
}

/**
 * @param {string} sheetId
 * @param {string} sheetName
 * @param {string} apiKey
 * @returns {Promise<string[][]>}
 */
export async function getSheetValues(sheetId, sheetName, apiKey) {
  const range = encodeURIComponent(`'${sheetName}'`)
  const url = `${API_BASE}/${sheetId}/values/${range}?key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sheets API ${res.status} (${sheetName}): ${await res.text()}`)
  const data = await res.json()
  return data.values || []
}
