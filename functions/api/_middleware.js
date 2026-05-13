import { getSession } from '../lib/auth.js'

// Rutas que no requieren sesión
const PUBLIC = ['/api/auth/login', '/api/auth/logout', '/api/health']

export async function onRequest({ request, env, next }) {
  const { pathname } = new URL(request.url)

  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return next()
  }

  const session = await getSession(request, env)
  if (!session) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  return next()
}
