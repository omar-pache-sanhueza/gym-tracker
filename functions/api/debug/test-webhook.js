import { computeHmac, buildEmailHtml } from '../../lib/email.js'

function fakeSesion() {
  return {
    fecha: new Date().toLocaleDateString('sv-SE'),
    inicioISO: new Date(Date.now() - 3600 * 1000).toISOString(),
    finISO: new Date().toISOString(),
    duracionTotalSeg: 3600,
    diaNumero: 1,
    diaNombre: 'Test',
    rpeGeneralDia: 7,
    comentarioGeneralDia: 'Test',
    bienestarPre: {
      sueno: 5, motivacion: 5, energia: 5, estres: 5,
      saludArticular: 5, recuperacionMuscular: 5, nota: '',
    },
    ejerciciosEjecutados: [{
      orden: 1, nombre: 'Press de banca', comentario: '',
      series: [{ numero: 1, reps: 8, rpeProgramado: 8, pesoKg: 70, descansoPrescritoSeg: 180 }],
    }],
  }
}

export async function onRequestGet({ env, request }) {
  const trace = {}
  const useReal = new URL(request.url).searchParams.get('real') === '1'

  const secret = env.APPS_SCRIPT_SECRET
  const webhook = env.APPS_SCRIPT_WEBHOOK

  trace.mode = useReal ? 'real (buildEmailHtml)' : 'simple'
  trace.envSecretPresent = !!secret
  trace.envSecretLength = secret ? secret.length : 0
  trace.envSecretFingerprint = secret ? `${secret.slice(0, 2)}…${secret.slice(-2)}` : null
  trace.envWebhookPresent = !!webhook
  trace.envWebhookHost = webhook ? new URL(webhook).host : null

  if (!secret || !webhook) {
    return Response.json({ ok: false, trace, error: 'Faltan env vars APPS_SCRIPT_SECRET o APPS_SCRIPT_WEBHOOK' })
  }

  const payload = useReal ? {
    to: env.EMAIL_TO || 'omar.pache@gmail.com',
    subject: 'Gym Tracker - test webhook (real)',
    htmlBody: buildEmailHtml(fakeSesion()),
  } : {
    to: env.EMAIL_TO || 'omar.pache@gmail.com',
    subject: 'Gym Tracker - test webhook',
    htmlBody: '<p>Test desde endpoint /api/debug/test-webhook</p>',
  }

  const message = JSON.stringify(payload)
  const payloadB64 = btoa(String.fromCharCode(...new TextEncoder().encode(message)))
  trace.payloadMessageLength = message.length
  trace.payloadMessagePreview = message.slice(0, 120)
  trace.payloadB64Length = payloadB64.length
  trace.payloadB64Preview = payloadB64.slice(0, 60)

  const sig = await computeHmac(payloadB64, secret)
  trace.computedSig = sig
  trace.computedSigLength = sig.length

  let status = null
  let bodyText = null
  let bodyJson = null
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payloadB64, sig }),
    })
    status = res.status
    bodyText = await res.text()
    try { bodyJson = JSON.parse(bodyText) } catch {}
  } catch (err) {
    trace.fetchError = String(err.message || err)
  }

  trace.appsScriptStatus = status
  trace.appsScriptBodyText = bodyText
  trace.appsScriptBodyJson = bodyJson

  const ok = bodyJson?.ok === true
  return Response.json({ ok, trace })
}
