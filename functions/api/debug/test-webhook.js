import { computeHmac } from '../../lib/email.js'

export async function onRequestGet({ env }) {
  const trace = {}

  const secret = env.APPS_SCRIPT_SECRET
  const webhook = env.APPS_SCRIPT_WEBHOOK

  trace.envSecretPresent = !!secret
  trace.envSecretLength = secret ? secret.length : 0
  trace.envSecretFingerprint = secret ? `${secret.slice(0, 2)}…${secret.slice(-2)}` : null
  trace.envWebhookPresent = !!webhook
  trace.envWebhookHost = webhook ? new URL(webhook).host : null

  if (!secret || !webhook) {
    return Response.json({ ok: false, trace, error: 'Faltan env vars APPS_SCRIPT_SECRET o APPS_SCRIPT_WEBHOOK' })
  }

  const payload = {
    to: env.EMAIL_TO || 'omar.pache@gmail.com',
    subject: 'Gym Tracker - test webhook',
    htmlBody: '<p>Test desde endpoint /api/debug/test-webhook</p>',
  }

  const message = JSON.stringify(payload)
  trace.payloadMessageLength = message.length
  trace.payloadMessagePreview = message.slice(0, 120)

  const sig = await computeHmac(message, secret)
  trace.computedSig = sig
  trace.computedSigLength = sig.length

  let status = null
  let bodyText = null
  let bodyJson = null
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, sig }),
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
