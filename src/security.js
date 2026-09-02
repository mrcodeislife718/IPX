import { createHash, randomUUID } from 'node:crypto';

export function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : Buffer.from(value)).digest('hex');
}

export function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;
}

export function requestId(headers = {}) {
  const supplied = headers['x-request-id'];
  if (typeof supplied === 'string' && /^[A-Za-z0-9._:-]{8,128}$/.test(supplied)) return supplied;
  return randomUUID();
}

export function bearerToken(headers) {
  const raw = headers.authorization;
  if (!raw || !/^Bearer\s+/i.test(raw)) return null;
  return raw.replace(/^Bearer\s+/i, '').trim();
}

export function safeText(value, { min = 1, max = 5000 } = {}) {
  if (typeof value !== 'string') throw new Error('Expected text');
  const v = value.trim();
  if (v.length < min || v.length > max) throw new Error(`Text length must be ${min}-${max}`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) throw new Error('Control characters are not allowed');
  return v;
}

export function safeSlug(value) {
  const v = safeText(value, { min: 3, max: 63 }).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) throw new Error('Invalid slug');
  return v;
}

export function safeUuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error('Invalid UUID');
  return value;
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
  return raw || req.socket.remoteAddress || null;
}

export async function readBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('Request body too large'), { statusCode: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function jsonResponse(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    ...extraHeaders
  });
  res.end(payload);
}
