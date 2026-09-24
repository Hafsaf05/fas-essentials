let csrf = '';
let initialization: Promise<any> | undefined;
export async function session() {
  if (!initialization) initialization = fetch('/api/session', { credentials: 'same-origin' }).then(async r => {
    if (!r.ok) throw new Error('Unable to connect to the store.');
    const result = await r.json(); csrf = result.csrf; return result;
  }).finally(() => { initialization = undefined; });
  return initialization;
}
export async function api<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (!csrf) await session();
  const response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(method !== 'GET' ? { 'X-CSRF-Token': csrf } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  if (result.csrf) csrf = result.csrf;
  if (method !== 'GET' && /^\/(orders|wishlist|reviews|admin\/products|admin\/orders|admin\/categories)/.test(path)) window.dispatchEvent(new Event('store:changed'));
  return result;
}
