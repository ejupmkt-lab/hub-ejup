import { authHeader } from './supabase.js';

// Cliente mínimo do Supabase para o servidor: REST (PostgREST), Auth (GoTrue) e Storage.
// Sempre com a chave secreta; quem chama é responsável por filtrar pelo usuário.

export class SbError extends Error {
  constructor(status, body) { super(`supabase ${status}`); this.status = status; this.body = body; }
}

const q = (v) => `"${String(v).replace(/"/g, '')}"`;
export const inList = (arr) => `in.(${[...new Set(arr)].map(q).join(',')})`;

export function createSb({ env, fetchImpl = fetch }) {
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = { apikey: key, ...authHeader(key) };

  async function call(path, { method = 'GET', body, headers = {} } = {}) {
    const r = await fetchImpl(base + path, {
      method,
      headers: { ...admin, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!r.ok) throw new SbError(r.status, data);
    return data;
  }

  const rest = {
    get: (table, query = '') => call(`/rest/v1/${table}${query ? '?' + query : ''}`),
    insert: (table, rows, { upsert = false, onConflict, returning = true } = {}) =>
      call(`/rest/v1/${table}${onConflict ? '?on_conflict=' + onConflict : ''}`, {
        method: 'POST', body: rows,
        headers: { Prefer: [returning ? 'return=representation' : 'return=minimal', upsert ? 'resolution=merge-duplicates' : ''].filter(Boolean).join(',') },
      }),
    update: (table, query, patch) => call(`/rest/v1/${table}?${query}`, { method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' } }),
    remove: (table, query) => call(`/rest/v1/${table}?${query}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }),
  };

  const asUser = (token) => ({ apikey: key, Authorization: `Bearer ${token}` });
  const auth = {
    login: (email, password) => call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }),
    refresh: (refresh_token) => call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token } }),
    signup: (email, password, data, redirect) =>
      call(`/auth/v1/signup${redirect ? '?redirect_to=' + encodeURIComponent(redirect) : ''}`, { method: 'POST', body: { email, password, data } }),
    recover: (email, redirect) =>
      call(`/auth/v1/recover${redirect ? '?redirect_to=' + encodeURIComponent(redirect) : ''}`, { method: 'POST', body: { email } }),
    user: (token) => call('/auth/v1/user', { headers: asUser(token) }),
    update: (token, attrs) => call('/auth/v1/user', { method: 'PUT', body: attrs, headers: asUser(token) }),
    logout: (token, scope = 'local') => call(`/auth/v1/logout?scope=${scope}`, { method: 'POST', headers: asUser(token) }),
    deleteUser: (id) => call(`/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };

  // link temporário para arquivo privado no Storage (vídeo ou material)
  async function signed(bucket, path, seconds = 6 * 3600) {
    const clean = String(path).replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    const r = await call(`/storage/v1/object/sign/${bucket}/${clean}`, { method: 'POST', body: { expiresIn: seconds } });
    const u = r?.signedURL || r?.signedUrl;
    return u ? base + '/storage/v1' + (u.startsWith('/') ? u : '/' + u) : null;
  }

  return { configured: Boolean(base && key), rest, auth, signed, base };
}
