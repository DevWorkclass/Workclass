/**
 * Client HTTP minimal vers l'API backend Express.
 * Base URL pilotée par NEXT_PUBLIC_API_URL (cf. app.config).
 *
 * Auto-refresh : sur une réponse 401 d'une requête authentifiée, on tente une
 * régénération du token via /auth/refresh (refresh token 7j) puis on rejoue la
 * requête une seule fois. Évite les échecs après expiration de l'access token (1h).
 */
import { appConfig } from '@/config/app.config';
import { getSession, setSession } from '@/lib/auth';

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

const FETCH_TIMEOUT_MS = 10_000;

function buildUrl(path: string): string {
  return `${appConfig.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** fetch avec timeout (AbortController). */
async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Régénère l'access token à partir du refresh token. Dé-doublonné (une seule
 * requête refresh concurrente). Renvoie le nouveau token ou null si impossible.
 */
async function refreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session?.refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await timedFetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { data?: { accessToken?: string; refreshToken?: string } };
      const accessToken = json.data?.accessToken;
      if (!accessToken) return null;
      setSession({
        ...session,
        accessToken,
        refreshToken: json.data?.refreshToken ?? session.refreshToken,
      });
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Construit les en-têtes en injectant le token courant de session. */
function withAuthHeaders(init?: RequestInit, json = true): Headers {
  const headers = new Headers(init?.headers);
  if (json) headers.set('Content-Type', 'application/json');
  const token = getSession()?.accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const isAuthRoute = path.startsWith('/auth/');

  let res = await timedFetch(url, { ...init, headers: withAuthHeaders(init) });

  // Token expiré → refresh + rejeu unique (sauf sur les routes d'auth elles-mêmes).
  if (res.status === 401 && !isAuthRoute && getSession()?.refreshToken) {
    const token = await refreshAccessToken();
    if (token) {
      res = await timedFetch(url, { ...init, headers: withAuthHeaders(init) });
    }
  }

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
 * Variante authentifiée : exige une session. Lève `ApiError(401)` si absente —
 * l'appelant doit alors rediriger vers le login.
 */
export async function apiAuth<T>(path: string, init?: RequestInit): Promise<T> {
  if (!getSession()?.accessToken) {
    throw new ApiError(401, 'Session admin absente');
  }
  return apiFetch<T>(path, init);
}

/**
 * Envoie un fichier (multipart/form-data) au backend et renvoie la réponse JSON.
 * Ne fixe PAS `Content-Type` (boundary auto). Auto-refresh sur 401.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  if (!getSession()?.accessToken) {
    throw new ApiError(401, 'Session admin absente');
  }
  const url = buildUrl(path);
  const send = () => timedFetch(url, { method: 'POST', headers: withAuthHeaders(undefined, false), body: formData });

  let res = await send();
  if (res.status === 401 && getSession()?.refreshToken) {
    const token = await refreshAccessToken();
    if (token) res = await send();
  }

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
 * Télécharge un fichier généré par le backend (export CSV/PDF). Auto-refresh sur 401.
 */
export async function apiDownload(
  path: string,
  body: unknown,
  fallbackName = 'export',
): Promise<void> {
  if (!getSession()?.accessToken) {
    throw new ApiError(401, 'Session admin absente');
  }
  const url = buildUrl(path);
  const send = () =>
    timedFetch(url, {
      method: 'POST',
      headers: withAuthHeaders(undefined, true),
      body: JSON.stringify(body),
    });

  let res = await send();
  if (res.status === 401 && getSession()?.refreshToken) {
    const token = await refreshAccessToken();
    if (token) res = await send();
  }

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
