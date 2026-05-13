import { verifyPassword, signSession, buildSessionCookie, checkRateLimit, recordFailedAttempt, clearAttempts } from '../../lib/auth.js'

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'

  const rate = checkRateLimit(ip)
  if (!rate.allowed) {
    return Response.json(
      { error: 'Demasiados intentos. Intenta en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const { password } = body || {}
  if (!password || typeof password !== 'string') {
    return Response.json({ error: 'Contraseña requerida.' }, { status: 400 })
  }

  const valid = await verifyPassword(password, env.APP_PASSWORD_HASH)
  if (!valid) {
    recordFailedAttempt(ip)
    return Response.json({ error: 'Contraseña incorrecta.' }, { status: 401 })
  }

  clearAttempts(ip)
  const token = await signSession(env)

  return Response.json({ ok: true }, {
    headers: { 'Set-Cookie': buildSessionCookie(token) },
  })
}
