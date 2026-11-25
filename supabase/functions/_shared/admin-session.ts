const DAY = 86400000;
async function signature(payload: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export async function createAdminSession(id: string, email: string, secret: string, ts = Date.now()) {
  const h = await signature(JSON.stringify({ id, email, ts }), secret);
  return btoa(JSON.stringify({ id, email, ts, h }));
}
export async function verifyAdminSession(token: string, secret: string, now = Date.now()): Promise<string | null> {
  try {
    const p = JSON.parse(atob(token));
    if (typeof p.id !== 'string' || typeof p.email !== 'string' || typeof p.ts !== 'number' || typeof p.h !== 'string' || p.ts > now || now - p.ts >= DAY) return null;
    const expected = await signature(JSON.stringify({ id: p.id, email: p.email, ts: p.ts }), secret);
    if (expected.length !== p.h.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ p.h.charCodeAt(i);
    return diff === 0 ? p.email : null;
  } catch { return null; }
}