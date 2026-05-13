import { clearSessionCookie } from '../../lib/auth.js'

export async function onRequestPost() {
  return new Response(null, {
    status: 204,
    headers: { 'Set-Cookie': clearSessionCookie() },
  })
}
