/**
 * Client HTTP minimal vers l'API backend Express.
 * Base URL pilotée par NEXT_PUBLIC_API_URL (cf. app.config).
 */
import { appConfig } from '@/config/app.config';
import { getSession } from '@/lib/auth';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${appConfig.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  const session = getSession();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => undefined);
    }
    throw new ApiError(res.status, `API ${res.status} sur ${path}`, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Variante authentifiée : injecte `Authorization: Bearer <accessToken>` depuis la
 * session admin (localStorage). Lève `ApiError(401)` si aucune session — l'appelant
 * doit alors rediriger vers le login.
 */
export async function apiAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  if (!session?.accessToken) {
    throw new ApiError(401, 'Session admin absente');
  }
  return apiFetch<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...init?.headers,
    },
  });
}
