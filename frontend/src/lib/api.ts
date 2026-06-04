/**
 * Client HTTP minimal vers l'API backend Express.
 * Base URL pilotée par NEXT_PUBLIC_API_URL (cf. app.config).
 */
import { appConfig } from '@/config/app.config';

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
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
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
