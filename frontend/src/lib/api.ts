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

/**
 * Envoie un fichier (multipart/form-data) au backend et renvoie la réponse JSON.
 * Ne fixe PAS `Content-Type` : le navigateur ajoute la boundary lui-même.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const session = getSession();
  if (!session?.accessToken) {
    throw new ApiError(401, 'Session admin absente');
  }
  const url = `${appConfig.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: formData,
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(res.status, `API ${res.status} sur ${path}`, body);
  }
  return res.json() as Promise<T>;
}

/**
 * Télécharge un fichier généré par le backend (export CSV/PDF).
 * POST authentifié → réponse binaire → déclenche le téléchargement navigateur.
 * Le nom de fichier est lu depuis l'en-tête `Content-Disposition` (sinon fallback).
 */
export async function apiDownload(
  path: string,
  body: unknown,
  fallbackName = 'export',
): Promise<void> {
  const session = getSession();
  if (!session?.accessToken) {
    throw new ApiError(401, 'Session admin absente');
  }
  const url = `${appConfig.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status} sur ${path}`);
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? fallbackName;

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
