import { sendEmail } from '../../lib/email.js'

export async function onRequestPost({ request, env }) {
  let sesion
  try {
    sesion = await request.json()
  } catch {
    return Response.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  if (!sesion.fecha || !sesion.inicioISO || !sesion.finISO) {
    return Response.json({ error: 'Faltan campos obligatorios en el payload.' }, { status: 400 })
  }

  const result = await sendEmail(sesion, env)

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 })
  }

  return Response.json({ enviado: true, messageId: result.messageId })
}
