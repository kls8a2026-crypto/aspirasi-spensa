import { randomUUID } from 'node:crypto';
import {
  DEFAULT_MEDIA_ASSETS,
  PRIMARY_ADMIN_EMAIL,
  SAMPLE_ASPIRATIONS,
} from '../config/appConfig.ts';
import {
  createSupabaseAuthClient,
  getSupabaseAdmin,
} from '../lib/supabase.ts';
import type {
  Aspiration,
  AspirationCategory,
  CreateAspirationInput,
  MediaAssets,
} from '../types/aspiration.ts';

const MEDIA_ROW_ID = 'media';

interface SupabaseAspirationRow {
  id: string;
  category: string;
  message: string;
  author: string;
  created_at: string;
  is_hidden: boolean;
  is_sample: boolean;
  admin_reply: string | null;
  admin_replied_at: string | null;
}

interface SupabaseMediaRow {
  id: string;
  school_logo_url: string | null;
  explore_gallery_urls: string[] | null;
  write_gallery_urls: string[] | null;
  updated_at: string;
}

function mapRowToAspiration(row: SupabaseAspirationRow): Aspiration {
  const item: Aspiration = {
    id: row.id,
    category: row.category as AspirationCategory,
    message: row.message,
    author: row.author,
    createdAt: new Date(row.created_at).toISOString(),
    isHidden: Boolean(row.is_hidden),
    isSample: Boolean(row.is_sample),
  };

  if (row.admin_reply && row.admin_reply.trim()) {
    item.adminReply = row.admin_reply;
    item.adminRepliedAt = row.admin_replied_at
      ? new Date(row.admin_replied_at).toISOString()
      : undefined;
  }

  return item;
}

function extractSupabaseErrorInfo(error: unknown): {
  code: string;
  message: string;
  hint: string;
} {
  if (error && typeof error === 'object') {
    const rec = error as Record<string, unknown>;
    return {
      code: typeof rec.code === 'string' ? rec.code : '',
      message: typeof rec.message === 'string' ? rec.message : '',
      hint: typeof rec.hint === 'string' ? rec.hint : '',
    };
  }
  return {
    code: '',
    message: error instanceof Error ? error.message : String(error ?? ''),
    hint: '',
  };
}

export function isSupabaseTableMissingError(error: unknown): boolean {
  const check = (err: unknown): boolean => {
    if (!err || typeof err !== 'object') return false;
    const rec = err as Record<string, unknown>;
    const code = typeof rec.code === 'string' ? rec.code : '';
    const msg =
      typeof rec.message === 'string' ? rec.message.toLowerCase() : '';
    return (
      code === 'PGRST205' ||
      code === '42P01' ||
      code === 'SUPABASE_SCHEMA_MISSING' ||
      msg.includes('schema cache') ||
      msg.includes('does not exist') ||
      msg.includes('tabel supabase belum dibuat')
    );
  };

  if (check(error)) return true;
  if (error && typeof error === 'object' && 'cause' in error) {
    return check((error as { cause?: unknown }).cause);
  }
  return false;
}

function buildSupabaseFailure(
  context: string,
  fallbackMessage: string,
  error: unknown
): Error {
  const info = extractSupabaseErrorInfo(error);
  const lowerMsg = info.message.toLowerCase();
  if (
    info.code === 'PGRST205' ||
    info.code === '42P01' ||
    lowerMsg.includes('does not exist') ||
    lowerMsg.includes('schema cache')
  ) {
    const err = new Error(
      'Tabel Supabase belum dibuat. Jalankan skrip supabase/schema.sql di Supabase SQL Editor lalu muat ulang halaman.',
      { cause: error }
    ) as Error & { code?: string };
    err.code = 'SUPABASE_SCHEMA_MISSING';
    return err;
  }

  console.error(
    `Supabase error (${context}): code=${info.code || 'none'} message=${info.message || 'unknown'}`
  );

  if (
    lowerMsg.includes('invalid api key') ||
    lowerMsg.includes('jwt') ||
    info.code === 'PGRST301'
  ) {
    return new Error(
      'Kunci API Supabase tidak valid. Periksa SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY pada panel Secrets.',
      { cause: error }
    );
  }

  const detail = info.code ? ` [${info.code}]` : '';
  return new Error(`${fallbackMessage}${detail}`, { cause: error });
}

export async function listPublicAspirationsSupabase(): Promise<Aspiration[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('aspirations')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as SupabaseAspirationRow[]).map(mapRowToAspiration);
  } catch (error) {
    throw buildSupabaseFailure(
      'listPublicAspirationsSupabase',
      'Gagal memuat daftar aspirasi publik dari Supabase.',
      error
    );
  }
}

export async function listAllAspirationsSupabase(): Promise<Aspiration[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('aspirations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as SupabaseAspirationRow[]).map(mapRowToAspiration);
  } catch (error) {
    throw buildSupabaseFailure(
      'listAllAspirationsSupabase',
      'Gagal memuat seluruh daftar aspirasi dari Supabase.',
      error
    );
  }
}

export async function insertAspirationSupabase(
  input: CreateAspirationInput
): Promise<Aspiration> {
  try {
    const supabase = getSupabaseAdmin();
    const id = randomUUID();
    const author =
      input.author && input.author.trim().length > 0
        ? input.author.trim()
        : 'Anonim';

    const { data, error } = await supabase
      .from('aspirations')
      .insert({
        id,
        category: input.category,
        message: input.message.trim(),
        author,
        is_hidden: false,
        is_sample: false,
      })
      .select('*')
      .single();

    if (error || !data) throw error ?? new Error('Insert returned no data');
    return mapRowToAspiration(data as SupabaseAspirationRow);
  } catch (error) {
    throw buildSupabaseFailure(
      'insertAspirationSupabase',
      'Gagal menyimpan aspirasi ke Supabase.',
      error
    );
  }
}

export async function updateAspirationVisibilitySupabase(
  id: string,
  isHidden: boolean
): Promise<Aspiration | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('aspirations')
      .update({ is_hidden: isHidden })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? mapRowToAspiration(data as SupabaseAspirationRow) : null;
  } catch (error) {
    throw buildSupabaseFailure(
      'updateAspirationVisibilitySupabase',
      'Gagal memperbarui visibilitas aspirasi di Supabase.',
      error
    );
  }
}

export async function updateAspirationReplySupabase(
  id: string,
  replyText: string
): Promise<Aspiration | null> {
  try {
    const supabase = getSupabaseAdmin();
    const trimmed = replyText.trim();
    const payload = trimmed
      ? {
          admin_reply: trimmed,
          admin_replied_at: new Date().toISOString(),
        }
      : {
          admin_reply: null,
          admin_replied_at: null,
        };

    const { data, error } = await supabase
      .from('aspirations')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data ? mapRowToAspiration(data as SupabaseAspirationRow) : null;
  } catch (error) {
    throw buildSupabaseFailure(
      'updateAspirationReplySupabase',
      'Gagal memperbarui tanggapan admin di Supabase.',
      error
    );
  }
}

export async function deleteAspirationByIdSupabase(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('aspirations')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    throw buildSupabaseFailure(
      'deleteAspirationByIdSupabase',
      'Gagal menghapus aspirasi dari Supabase.',
      error
    );
  }
}

export async function insertSampleAspirationsSupabase(): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const rows = SAMPLE_ASPIRATIONS.map((sample) => ({
      id: sample.id,
      category: sample.category,
      message: sample.message,
      author: sample.author,
      created_at: new Date(sample.createdAt).toISOString(),
      is_hidden: false,
      is_sample: true,
      admin_reply: sample.adminReply ?? null,
      admin_replied_at: sample.adminRepliedAt
        ? new Date(sample.adminRepliedAt).toISOString()
        : null,
    }));

    const { error } = await supabase
      .from('aspirations')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    throw buildSupabaseFailure(
      'insertSampleAspirationsSupabase',
      'Gagal memuat aspirasi contoh ke Supabase.',
      error
    );
  }
}

export async function getMediaSettingsSupabase(): Promise<MediaAssets> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('media_settings')
      .select('*')
      .eq('id', MEDIA_ROW_ID)
      .maybeSingle();

    if (error) throw error;
    const row = data as SupabaseMediaRow | null;
    if (!row) {
      return DEFAULT_MEDIA_ASSETS;
    }

    return {
      schoolLogoUrl:
        typeof row.school_logo_url === 'string' &&
        row.school_logo_url.length > 0
          ? row.school_logo_url
          : null,
      exploreGalleryUrls:
        Array.isArray(row.explore_gallery_urls) &&
        row.explore_gallery_urls.length > 0
          ? row.explore_gallery_urls
          : DEFAULT_MEDIA_ASSETS.exploreGalleryUrls,
      writeGalleryUrls:
        Array.isArray(row.write_gallery_urls) &&
        row.write_gallery_urls.length > 0
          ? row.write_gallery_urls
          : DEFAULT_MEDIA_ASSETS.writeGalleryUrls,
    };
  } catch (error) {
    throw buildSupabaseFailure(
      'getMediaSettingsSupabase',
      'Gagal memuat pengaturan media dari Supabase.',
      error
    );
  }
}

export async function upsertMediaSettingsSupabase(
  assets: MediaAssets
): Promise<MediaAssets> {
  try {
    const supabase = getSupabaseAdmin();
    const exploreUrls =
      assets.exploreGalleryUrls.length > 0
        ? assets.exploreGalleryUrls.slice(0, 10)
        : DEFAULT_MEDIA_ASSETS.exploreGalleryUrls;
    const writeUrls =
      assets.writeGalleryUrls.length > 0
        ? assets.writeGalleryUrls.slice(0, 10)
        : DEFAULT_MEDIA_ASSETS.writeGalleryUrls;

    const { data, error } = await supabase
      .from('media_settings')
      .upsert(
        {
          id: MEDIA_ROW_ID,
          school_logo_url: assets.schoolLogoUrl ?? null,
          explore_gallery_urls: exploreUrls,
          write_gallery_urls: writeUrls,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error || !data) throw error ?? new Error('Upsert returned no data');
    const saved = data as SupabaseMediaRow;

    return {
      schoolLogoUrl: saved.school_logo_url ?? null,
      exploreGalleryUrls:
        saved.explore_gallery_urls ?? DEFAULT_MEDIA_ASSETS.exploreGalleryUrls,
      writeGalleryUrls:
        saved.write_gallery_urls ?? DEFAULT_MEDIA_ASSETS.writeGalleryUrls,
    };
  } catch (error) {
    throw buildSupabaseFailure(
      'upsertMediaSettingsSupabase',
      'Gagal menyimpan pengaturan media ke Supabase.',
      error
    );
  }
}

export async function isSupabaseAdminEmail(
  email: string,
  emailVerified = true
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !emailVerified) return false;
  if (normalized === PRIMARY_ADMIN_EMAIL) return true;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .ilike('email', normalized)
      .limit(1);

    if (error) {
      if (!isSupabaseTableMissingError(error)) {
        const info = extractSupabaseErrorInfo(error);
        console.error(
          `Supabase admin_users lookup failed: code=${info.code} message=${info.message}`
        );
      }
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function verifySupabaseAccessToken(token: string): Promise<{
  uid: string;
  email: string;
  emailVerified: boolean;
} | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return {
      uid: data.user.id,
      email: data.user.email ?? '',
      emailVerified: Boolean(
        data.user.email_confirmed_at || data.user.confirmed_at
      ),
    };
  } catch {
    return null;
  }
}

export async function signInSupabaseAdmin(
  email: string,
  password: string
): Promise<{
  accessToken: string;
  uid: string;
  email: string;
  isAdmin: boolean;
}> {
  const authClient = createSupabaseAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    const errMsg = error?.message?.toLowerCase() ?? '';
    if (errMsg.includes('email not confirmed')) {
      throw new Error(
        'Email admin di Supabase belum dikonfirmasi. Aktifkan konfirmasi email di Supabase Auth → Users.'
      );
    }
    throw new Error('Username atau password admin tidak sesuai.');
  }

  const userEmail = data.user.email ?? email;
  const isVerified = Boolean(
    data.user.email_confirmed_at || data.user.confirmed_at || data.session
  );
  const isAdmin = await isSupabaseAdminEmail(userEmail, isVerified);

  return {
    accessToken: data.session.access_token,
    uid: data.user.id,
    email: userEmail,
    isAdmin,
  };
}

export async function getSupabaseGoogleOAuthUrl(
  redirectTo: string
): Promise<string> {
  const authClient = createSupabaseAuthClient('implicit');
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error || !data?.url) {
    const info = extractSupabaseErrorInfo(error);
    console.error(
      `Supabase Google OAuth error: code=${info.code || 'none'} message=${info.message || 'unknown'}`
    );
    throw new Error(
      'Gagal menyiapkan login Google melalui Supabase. Pastikan Google Provider aktif di Supabase Auth.'
    );
  }

  return data.url;
}
