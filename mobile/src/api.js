import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'http://localhost:5000';

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = options.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const hasJsonBody = options.body && typeof options.body === 'object';
  if (hasJsonBody) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method || 'GET',
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}
