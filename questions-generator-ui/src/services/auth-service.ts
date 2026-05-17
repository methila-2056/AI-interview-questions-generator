export const API_BASE_URL = 'https://dle7ki4lf2.execute-api.us-east-1.amazonaws.com/prod';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
};

type AuthUser = {
  name?: string;
  email: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  console.log('[auth-service] POST', url, body);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  console.log('[auth-service] Response status:', res.status, res.statusText);

  const resClone = res.clone();

  if (!res.ok) {
    const text = await resClone.text().catch(() => '');
    console.error('[auth-service] Error response:', text || `Status ${res.status}`);
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as T;
  console.log('[auth-service] Response JSON:', data);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  console.log('[auth-service] loginUser called', { email });
  return postJson<AuthUser>(API_ENDPOINTS.LOGIN, { email, password });
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthUser> {
  console.log('[auth-service] registerUser called', { name, email });
  return postJson<AuthUser>(API_ENDPOINTS.REGISTER, { email, userName: name, password });
}