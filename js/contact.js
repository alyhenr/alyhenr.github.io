/*
 * contact.js (module, pure): the contact form's talk with the Gateway, by its contract (the
 * Gateway's README, "Sending a message"). No DOM: the QA's `gateway` step imports it in Node.
 *
 *   POST <gateway>/v1/submit/<form key>
 *   { turnstile_token, locale: 'pt-BR', fields: { name, email | phone, message, estimate } }
 *   201 { ok, id, message } · errors { ok: false, error, message } (422 invalid_fields adds the
 *   fields' messages; turnstile_failed: reset the widget; 429 has Retry-After)
 *
 * The Gateway's pt-BR message is shown as it comes; ours are only for an answer without one.
 */

/** The Gateway's field lengths. */
export const LIMITS = { name: 120, email: 254, phone: 32, message: 4000, estimate: 120 };

/** The longest wait a 429 can impose on the button, in seconds. */
export const MAX_WAIT_S = 120;

/** Our copy, for answers that bring no message of their own. */
export const MESSAGES = {
  sent: 'Pedido enviado. Eu leio tudo e respondo em até 1 dia útil.',
  fields: 'Falta pouco: veja os campos marcados.',
  turnstile: 'A verificação anti-robô não passou. Ela já recomeçou: tente enviar de novo.',
  rate: 'Muitos envios em pouco tempo. Espere um pouco e tente de novo.',
  unavailable: 'O envio não está respondendo agora. Seu texto continua aqui: tente de novo em alguns minutos.',
  network: 'Não deu para enviar: parece que a conexão caiu. Seu texto continua aqui: confira a internet e tente de novo.',
  error: 'Não deu para enviar o pedido. Tente de novo em alguns minutos.',
};

/** The Gateway's field → the form's input. */
const FORM_FIELD = { name: 'nome', email: 'contato', phone: 'contato', message: 'mensagem', estimate: 'estimativa' };

/** The URL the form posts to; '' while the endpoint is empty (the form doesn't send). */
export function submitUrl(gateway, formKey) {
  const base = String(gateway || '').trim().replace(/\/+$/, '');
  return base ? `${base}/v1/submit/${formKey}` : '';
}

/** The form's one contact field → the Gateway's email or phone. */
export function splitContact(v) {
  v = String(v || '').trim().replace(/\s+/g, ' ');
  return v.includes('@') ? { email: v } : { phone: v };
}

const cut = (s, n, mark = '') => (s.length > n ? s.slice(0, n - mark.length) + mark : s);

/**
 * The request body. values: the form's { nome, contato, mensagem, estimativa } and `resumo`, the
 * estimate's short line. The Gateway requires a message and keeps its estimate field short, so the
 * estimate's full text goes at the end of the message and its short line in `estimate`.
 */
export function submission(values, token) {
  const t = (k) => String(values[k] || '').trim();
  const est = t('estimativa');
  const message = [t('mensagem'), est && `Estimativa: ${est}`].filter(Boolean).join('\n\n');
  const fields = { name: cut(t('nome'), LIMITS.name), ...splitContact(t('contato')), message: cut(message, LIMITS.message) };
  if (fields.email) fields.email = cut(fields.email, LIMITS.email);
  if (fields.phone) fields.phone = cut(fields.phone, LIMITS.phone);
  if (est) fields.estimate = cut(t('resumo') || est, LIMITS.estimate, '…');
  return { turnstile_token: token, locale: 'pt-BR', fields };
}

/** Retry-After (seconds or an HTTP date) → whole seconds, capped; null when absent or unreadable. */
function waitSeconds(header, body) {
  let s = null;
  const raw = header ?? body?.retry_after;
  if (raw != null && raw !== '') {
    if (/^\s*\d+\s*$/.test(String(raw))) s = Number(raw);
    else if (!Number.isNaN(Date.parse(raw))) s = Math.ceil((Date.parse(raw) - Date.now()) / 1000);
  }
  return s == null ? null : Math.max(0, Math.min(MAX_WAIT_S, s));
}

/**
 * 422's per-field messages → { formInput: text }. The Gateway sends { field: { code, message } };
 * plain text, a list of texts, or a list of { field, message } are read too.
 */
function fieldMessages(body) {
  const raw = body?.fields ?? body?.errors ?? {};
  const pairs = Array.isArray(raw) ? raw.map((e) => [e?.field, e?.message]) : Object.entries(raw);
  const out = {};
  for (const [k, m] of pairs) {
    const input = FORM_FIELD[k];
    const text = Array.isArray(m) ? m.filter(Boolean).join(' ')
      : m && typeof m === 'object' ? String(m.message || '')
      : String(m || '');
    if (input && text && !out[input]) out[input] = text;
  }
  return out;
}

/**
 * The Gateway's answer → what the form shows: { kind, message, fields, retryAfter }.
 * kind: 'sent' | 'fields' (422) | 'turnstile' | 'retry' (429, 5xx) | 'error'.
 */
export function readAnswer(status, body, retryAfter = null) {
  const b = body && typeof body === 'object' ? body : {};
  const msg = (fallback) => (typeof b.message === 'string' && b.message.trim() ? b.message.trim() : fallback);
  const answer = (kind, message, fields = {}, wait = null) => ({ kind, message, fields, retryAfter: wait });
  if (status >= 200 && status < 300 && b.ok !== false) return answer('sent', msg(MESSAGES.sent));
  if (b.error === 'turnstile_failed') return answer('turnstile', msg(MESSAGES.turnstile));
  if (b.error === 'invalid_fields' || status === 422) return answer('fields', msg(MESSAGES.fields), fieldMessages(b));
  if (status === 429) return answer('retry', msg(MESSAGES.rate), {}, waitSeconds(retryAfter, b));
  if (status >= 500) return answer('retry', msg(MESSAGES.unavailable));
  return answer('error', msg(MESSAGES.error));
}
