import type { ApiEnvelope } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const ACCESS_TOKEN_KEY = 'vesion.accessToken';
const REFRESH_TOKEN_KEY = 'vesion.refreshToken';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string | string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStore = {
  getAccess: (): string | null =>
    typeof window === 'undefined' ? null : sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: (): string | null =>
    typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_TOKEN_KEY),
  set(access: string, refresh?: string) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip auth header and 401-refresh handling (public endpoints). */
  anonymous?: boolean;
  /** Raw FormData body (file uploads). */
  formData?: FormData;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Deduplicate concurrent refreshes.
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: tokenStore.getRefresh() ?? undefined }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>;
      tokenStore.set(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { body, anonymous, formData, headers, ...init } = options;

  const finalHeaders: Record<string, string> = {
    ...(formData ? {} : { 'Content-Type': 'application/json' }),
    ...((headers as Record<string, string>) ?? {}),
  };
  const token = tokenStore.getAccess();
  if (!anonymous && token) finalHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: finalHeaders,
    credentials: 'include',
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && !anonymous && !retried && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, true);
    tokenStore.clear();
    if (typeof window !== 'undefined' && window.location.pathname.match(/^\/(dashboard|admin)/)) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as
    | (ApiEnvelope<T> & { message?: string | string[]; error?: string })
    | null;

  if (!res.ok) {
    const message = Array.isArray(json?.message)
      ? json?.message.join(', ')
      : json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message ?? 'Request failed', json?.message);
  }

  return (json?.data ?? json) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', formData }),
  url: API_URL,
};

/** Server-side fetch for public content (marketing pages, blog, portfolio). */
export async function serverFetch<T>(path: string, revalidateSeconds = 120): Promise<T | null> {
  try {
    const base = process.env.API_INTERNAL_URL ?? API_URL;
    const res = await fetch(`${base}${path}`, { next: { revalidate: revalidateSeconds } });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiEnvelope<T>;
    return json.data;
  } catch {
    return null;
  }
}
