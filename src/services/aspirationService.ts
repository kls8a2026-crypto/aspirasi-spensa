import { DEFAULT_MEDIA_ASSETS, FORM_LIMITS } from '../config/appConfig';
import type {
  Aspiration,
  CreateAspirationInput,
  MediaAssets,
} from '../types/aspiration';

export interface AdminSessionUser {
  uid: string;
  email: string | null;
}

export type OAuthCallbackResult =
  | { status: 'none' }
  | { status: 'authenticated'; user: AdminSessionUser }
  | { status: 'unauthorized'; user: AdminSessionUser }
  | { status: 'error'; message: string };

type Listener<T> = (data: T) => void;
type ErrorListener = (err: Error) => void;

let inMemorySupabaseSession: {
  accessToken: string;
  user: AdminSessionUser;
} | null = null;

export function hasActiveSupabaseSession(): boolean {
  return Boolean(inMemorySupabaseSession);
}

const publicListeners = new Set<{
  onData: Listener<Aspiration[]>;
  onError?: ErrorListener;
}>();

const adminListeners = new Set<{
  onData: Listener<Aspiration[]>;
  onError?: ErrorListener;
}>();

const mediaListeners = new Set<{
  onData: Listener<MediaAssets>;
  onError?: ErrorListener;
}>();

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!inMemorySupabaseSession) {
    throw new Error('Sesi login tidak ditemukan. Silakan masuk kembali.');
  }
  return {
    Authorization: `Bearer ${inMemorySupabaseSession.accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Abaikan jika body bukan JSON
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

async function fetchPublicAspirations(): Promise<Aspiration[]> {
  const res = await fetch('/api/aspirations', { cache: 'no-store' });
  return parseJsonResponse<Aspiration[]>(res);
}

async function fetchAllAspirations(): Promise<Aspiration[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/admin/aspirations', {
    headers,
    cache: 'no-store',
  });
  return parseJsonResponse<Aspiration[]>(res);
}

async function fetchMediaSettings(): Promise<MediaAssets> {
  const res = await fetch('/api/settings/media', { cache: 'no-store' });
  return parseJsonResponse<MediaAssets>(res);
}

async function refreshPublicAspirations(): Promise<void> {
  if (publicListeners.size === 0) return;
  try {
    const items = await fetchPublicAspirations();
    publicListeners.forEach((l) => l.onData(items));
  } catch (err) {
    const wrapped =
      err instanceof Error ? err : new Error('Gagal memuat aspirasi publik.');
    publicListeners.forEach((l) => l.onError?.(wrapped));
  }
}

async function refreshAdminAspirations(): Promise<void> {
  if (adminListeners.size === 0 || !inMemorySupabaseSession) {
    return;
  }
  try {
    const items = await fetchAllAspirations();
    adminListeners.forEach((l) => l.onData(items));
  } catch (err) {
    const wrapped =
      err instanceof Error ? err : new Error('Gagal memuat aspirasi admin.');
    adminListeners.forEach((l) => l.onError?.(wrapped));
  }
}

async function refreshMediaSettings(): Promise<void> {
  if (mediaListeners.size === 0) return;
  try {
    const assets = await fetchMediaSettings();
    mediaListeners.forEach((l) => l.onData(assets));
  } catch (err) {
    const wrapped =
      err instanceof Error ? err : new Error('Gagal memuat pengaturan media.');
    mediaListeners.forEach((l) => l.onError?.(wrapped));
  }
}

export function subscribePublicAspirations(
  onData: (items: Aspiration[]) => void,
  onError?: (err: Error) => void
): () => void {
  const entry = { onData, onError };
  publicListeners.add(entry);
  void refreshPublicAspirations();

  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void refreshPublicAspirations();
    }
  }, 15000);

  return () => {
    window.clearInterval(timer);
    publicListeners.delete(entry);
  };
}

export function subscribeAllAspirations(
  onData: (items: Aspiration[]) => void,
  onError?: (err: Error) => void
): () => void {
  const entry = { onData, onError };
  adminListeners.add(entry);
  void refreshAdminAspirations();

  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void refreshAdminAspirations();
    }
  }, 15000);

  return () => {
    window.clearInterval(timer);
    adminListeners.delete(entry);
  };
}

export function subscribeMediaSettings(
  onData: (assets: MediaAssets) => void,
  onError?: (err: Error) => void
): () => void {
  const entry = { onData, onError };
  mediaListeners.add(entry);
  void refreshMediaSettings();

  return () => {
    mediaListeners.delete(entry);
  };
}

export async function publishAspiration(
  input: CreateAspirationInput
): Promise<void> {
  const cleanMessage = input.message
    .trim()
    .slice(0, FORM_LIMITS.maxMessageLength);
  const trimmedAuthor = (input.author ?? '')
    .trim()
    .slice(0, FORM_LIMITS.maxAuthorLength);
  const cleanAuthor = trimmedAuthor.length > 0 ? trimmedAuthor : 'Anonim';

  const res = await fetch('/api/aspirations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: input.category,
      message: cleanMessage,
      author: cleanAuthor,
    }),
  });
  await parseJsonResponse<Aspiration>(res);
  await Promise.all([refreshPublicAspirations(), refreshAdminAspirations()]);
}

export async function toggleAspirationVisibility(
  id: string,
  nextHidden: boolean
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `/api/admin/aspirations/${encodeURIComponent(id)}/visibility`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isHidden: nextHidden }),
    }
  );
  await parseJsonResponse<Aspiration>(res);
  await Promise.all([refreshAdminAspirations(), refreshPublicAspirations()]);
}

export async function replyToAspiration(
  id: string,
  replyText: string
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `/api/admin/aspirations/${encodeURIComponent(id)}/reply`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ reply: replyText.trim().slice(0, 400) }),
    }
  );
  await parseJsonResponse<Aspiration>(res);
  await Promise.all([refreshAdminAspirations(), refreshPublicAspirations()]);
}

export async function removeAspiration(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/aspirations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await parseJsonResponse<void>(res);
  await Promise.all([refreshAdminAspirations(), refreshPublicAspirations()]);
}

export async function seedSampleAspirations(): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/admin/aspirations/seed', {
    method: 'POST',
    headers,
  });
  await parseJsonResponse<Aspiration[]>(res);
  await Promise.all([refreshAdminAspirations(), refreshPublicAspirations()]);
}

export async function updateMediaSettings(assets: MediaAssets): Promise<void> {
  const headers = await getAuthHeaders();
  const safeExplore = assets.exploreGalleryUrls.slice(0, 10);
  const safeWrite = assets.writeGalleryUrls.slice(0, 10);

  const res = await fetch('/api/admin/settings/media', {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      schoolLogoUrl: assets.schoolLogoUrl ?? null,
      exploreGalleryUrls:
        safeExplore.length > 0
          ? safeExplore
          : DEFAULT_MEDIA_ASSETS.exploreGalleryUrls,
      writeGalleryUrls:
        safeWrite.length > 0
          ? safeWrite
          : DEFAULT_MEDIA_ASSETS.writeGalleryUrls,
    }),
  });
  await parseJsonResponse<MediaAssets>(res);
  await refreshMediaSettings();
}

export async function requestSupabaseGoogleOAuthUrl(): Promise<string> {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const res = await fetch('/api/admin/oauth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectTo }),
  });
  const data = await parseJsonResponse<{ url: string }>(res);
  return data.url;
}

export async function signInAdminWithGoogle(): Promise<{
  oauthUrl: string;
  requiresNewTab: boolean;
}> {
  const oauthUrl = await requestSupabaseGoogleOAuthUrl();
  const isInIframe = window.self !== window.top;

  if (!isInIframe) {
    window.location.assign(oauthUrl);
    return { oauthUrl, requiresNewTab: false };
  }

  return { oauthUrl, requiresNewTab: true };
}

export async function consumeSupabaseOAuthCallback(): Promise<OAuthCallbackResult> {
  if (typeof window === 'undefined') return { status: 'none' };

  const rawHash = window.location.hash;
  const rawSearch = window.location.search;

  const queryParams = new URLSearchParams(rawSearch);
  const hashQuery = rawHash.includes('access_token=')
    ? rawHash.slice(rawHash.indexOf('access_token='))
    : rawHash.includes('error=')
      ? rawHash.slice(rawHash.indexOf('error='))
      : '';
  const hashParams = new URLSearchParams(hashQuery);

  const errorDescription =
    hashParams.get('error_description') ||
    queryParams.get('error_description') ||
    hashParams.get('error') ||
    queryParams.get('error');

  if (errorDescription) {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}#admin`
    );
    return {
      status: 'error',
      message: errorDescription,
    };
  }

  const accessToken = hashParams.get('access_token');
  if (!accessToken) {
    return { status: 'none' };
  }

  window.history.replaceState(null, '', `${window.location.pathname}#admin`);

  try {
    const res = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const data = await parseJsonResponse<{
      uid: string;
      email: string;
      isAdmin: boolean;
    }>(res);

    const user: AdminSessionUser = {
      uid: data.uid,
      email: data.email || null,
    };

    if (!data.isAdmin) {
      inMemorySupabaseSession = null;
      return { status: 'unauthorized', user };
    }

    inMemorySupabaseSession = {
      accessToken,
      user,
    };
    return { status: 'authenticated', user };
  } catch (err) {
    inMemorySupabaseSession = null;
    return {
      status: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal memverifikasi sesi login Google dari Supabase.',
    };
  }
}

export async function signInAdminWithCredentials(
  usernameOrEmail: string,
  password: string
): Promise<AdminSessionUser> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: usernameOrEmail, password }),
  });

  const payload = await parseJsonResponse<{
    accessToken: string;
    user: { uid: string; email: string; isAdmin: boolean };
  }>(res);

  const sessionUser: AdminSessionUser = {
    uid: payload.user.uid,
    email: payload.user.email,
  };
  inMemorySupabaseSession = {
    accessToken: payload.accessToken,
    user: sessionUser,
  };
  return sessionUser;
}

export async function logoutAdmin(): Promise<void> {
  inMemorySupabaseSession = null;
}
