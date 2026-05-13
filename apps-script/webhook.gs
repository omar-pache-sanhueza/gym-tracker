// Pegar en script.google.com, asociado al Gmail personal.
// Publicar como Web App: Ejecutar como Yo, Acceso Cualquiera con enlace.

const SHARED_SECRET = 'REEMPLAZAR_POR_SECRETO_LARGO';
const ALLOWED_RECIPIENT = 'omar.pache@gmail.com';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { payloadB64, sig } = body;
    if (!payloadB64 || !sig) {
      return jsonResponse({ ok: false, error: 'missing_fields' });
    }
    // HMAC sobre el base64 (ASCII puro) para evitar problemas de codificación UTF-8.
    const expected = computeHmac(payloadB64, SHARED_SECRET);
    if (sig !== expected) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }
    const decoded = Utilities.newBlob(Utilities.base64Decode(payloadB64)).getDataAsString('UTF-8');
    const data = JSON.parse(decoded);
    if (data.to !== ALLOWED_RECIPIENT) {
      return jsonResponse({ ok: false, error: 'recipient_not_allowed' });
    }
    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      htmlBody: data.htmlBody
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
