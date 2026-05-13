// Pegar en script.google.com, asociado al Gmail personal.
// Publicar como Web App: Ejecutar como Yo, Acceso Cualquiera con enlace.

const SHARED_SECRET = 'REEMPLAZAR_POR_SECRETO_LARGO';
const ALLOWED_RECIPIENT = 'omar.pache@gmail.com';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { payload, sig } = body;
    const expected = computeHmac(JSON.stringify(payload), SHARED_SECRET);
    if (sig !== expected) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }
    if (payload.to !== ALLOWED_RECIPIENT) {
      return jsonResponse({ ok: false, error: 'recipient_not_allowed' });
    }
    MailApp.sendEmail({
      to: payload.to,
      subject: payload.subject,
      htmlBody: payload.htmlBody
    });
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function computeHmac(message, secret) {
  const bytes = Utilities.computeHmacSha256Signature(message, secret);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
