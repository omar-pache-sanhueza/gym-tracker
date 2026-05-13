const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/**
 * @param {number} secs
 * @returns {string}
 */
function formatDuration(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

/** @param {number} n */
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n)

/**
 * @param {object} sesion - SesionCompletada
 * @returns {string}
 */
export function buildEmailHtml(sesion) {
  const fecha = new Date(`${sesion.fecha}T12:00:00`)
  const fechaStr = `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`
  const b = sesion.bienestarPre

  const ejerciciosHtml = sesion.ejerciciosEjecutados.map(ej => `
    <div style="border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:12px;">
      <p style="font-weight:600;margin-bottom:8px;">${ej.orden}. ${ej.nombre}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${ej.series.map(s => `
          <tr>
            <td style="padding:3px 8px 3px 0;color:#555;white-space:nowrap;">Serie ${s.numero}</td>
            <td style="padding:3px 8px;">${s.reps} reps${s.rpeProgramado ? ` RPE @${s.rpeProgramado}` : ''}</td>
            <td style="padding:3px 8px;">${s.pesoKg !== null && s.pesoKg !== undefined ? `${s.pesoKg} kg` : 'peso corporal'}</td>
            <td style="padding:3px 0;color:#888;">${formatDuration(s.descansoPrescritoSeg)} desc.</td>
          </tr>`).join('')}
      </table>
      ${ej.comentario ? `<p style="margin-top:8px;color:#555;font-style:italic;font-size:14px;">${ej.comentario}</p>` : ''}
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222;background:#fff;">
  <h1 style="font-size:22px;margin:0 0 4px;">Gym Tracker</h1>
  <p style="color:#888;margin:0 0 24px;font-size:14px;">Resumen de entrenamiento</p>

  <h2 style="font-size:18px;border-bottom:2px solid #f0f0f0;padding-bottom:8px;margin-bottom:16px;">${fechaStr}</h2>

  <h3 style="font-size:15px;margin-bottom:10px;">Bienestar pre-entreno</h3>
  <table style="width:100%;margin-bottom:24px;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:3px 0;color:#555;">Sueño</td><td>${stars(b.sueno)}</td></tr>
    ${b.motivacion != null ? `<tr><td style="padding:3px 0;color:#555;">Motivación</td><td>${stars(b.motivacion)}</td></tr>` : ''}
    <tr><td style="padding:3px 0;color:#555;">Energía</td><td>${stars(b.energia)}</td></tr>
    <tr><td style="padding:3px 0;color:#555;">Estrés</td><td>${stars(b.estres)}</td></tr>
    <tr><td style="padding:3px 0;color:#555;">Salud articular</td><td>${stars(b.saludArticular)}</td></tr>
    <tr><td style="padding:3px 0;color:#555;">Recuperación muscular</td><td>${stars(b.recuperacionMuscular)}</td></tr>
    ${b.nota ? `<tr><td colspan="2" style="padding:6px 0;color:#666;font-style:italic;">${b.nota}</td></tr>` : ''}
  </table>

  <h3 style="font-size:15px;margin-bottom:10px;">Ejercicios del día</h3>
  ${ejerciciosHtml}

  <table style="width:100%;margin:8px 0 24px;border-collapse:collapse;">
    <tr><td style="padding:4px 0;color:#555;">Duración</td><td style="text-align:right;font-weight:600;">${formatDuration(sesion.duracionTotalSeg)}</td></tr>
    <tr><td style="padding:4px 0;color:#555;">RPE general del día</td><td style="text-align:right;font-weight:600;">${String(sesion.rpeGeneralDia).replace('.', ',')} / 10</td></tr>
  </table>

  ${sesion.comentarioGeneralDia ? `
  <h3 style="font-size:15px;margin-bottom:8px;">Comentario general</h3>
  <p style="background:#f8f8f8;border-radius:8px;padding:12px;color:#444;margin-bottom:24px;">${sesion.comentarioGeneralDia}</p>` : ''}

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#bbb;font-size:12px;">Enviado automáticamente por Gym Tracker.</p>
</body>
</html>`
}

/**
 * Calcula HMAC-SHA256 usando Web Crypto API (disponible en Workers).
 * El secreto se interpreta como UTF-8 para matchear con Apps Script
 * (Utilities.computeHmacSha256Signature trata el secret como string UTF-8).
 * @param {string} message
 * @param {string} secret
 * @returns {Promise<string>}
 */
export async function computeHmac(message, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Envía el resumen de la sesión por email vía Apps Script.
 * @param {object} sesion - SesionCompletada enriquecida (incluye diaNumero y diaNombre)
 * @param {object} env
 * @returns {Promise<{ ok: boolean, messageId?: string, error?: string }>}
 */
export async function sendEmail(sesion, env) {
  const fecha = new Date(`${sesion.fecha}T12:00:00`)
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const diaAbr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()]

  const payload = {
    to: env.EMAIL_TO || 'omar.pache@gmail.com',
    subject: `Gym Tracker · ${diaAbr} ${dd}/${mm} · Día ${sesion.diaNumero ?? ''} - ${sesion.diaNombre ?? ''}`,
    htmlBody: buildEmailHtml(sesion),
  }

  const payloadStr = JSON.stringify(payload)
  const payloadB64 = btoa(String.fromCharCode(...new TextEncoder().encode(payloadStr)))
  const sig = await computeHmac(payloadB64, env.APPS_SCRIPT_SECRET)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25_000)

  try {
    const res = await fetch(env.APPS_SCRIPT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payloadB64, sig }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return { ok: false, error: `Apps Script HTTP ${res.status}` }

    const data = await res.json()
    return data.ok
      ? { ok: true, messageId: data.messageId || 'sent' }
      : { ok: false, error: data.error || 'Error desconocido en Apps Script' }
  } catch (err) {
    clearTimeout(timer)
    return { ok: false, error: err.name === 'AbortError' ? 'Timeout (>25s)' : String(err.message) }
  }
}
