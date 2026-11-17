import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;
let cachedConfigKey = '';

function readEnv(name: string): string {
  return (process.env[name] ?? '').trim();
}

function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  const dashboardMatch = raw.match(
    /^https?:\/\/(?:app\.)?supabase\.com\/dashboard\/project\/([a-z0-9]+)/i
  );
  if (dashboardMatch) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return raw.replace(/\/+$/, '');
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    normalizeSupabaseUrl(readEnv('SUPABASE_URL')) &&
      readEnv('SUPABASE_SERVICE_ROLE_KEY')
  );
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    normalizeSupabaseUrl(readEnv('SUPABASE_URL')) &&
      (readEnv('SUPABASE_ANON_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY'))
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = normalizeSupabaseUrl(readEnv('SUPABASE_URL'));
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Konfigurasi Supabase belum lengkap. Tambahkan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY pada Secrets.'
    );
  }

  const nextKey = `${url}::${serviceRoleKey}`;
  if (!cachedAdminClient || cachedConfigKey !== nextKey) {
    cachedAdminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    cachedConfigKey = nextKey;
  }

  return cachedAdminClient;
}

export function createSupabaseAuthClient(
  flowType: 'implicit' | 'pkce' = 'implicit'
): SupabaseClient {
  const url = normalizeSupabaseUrl(readEnv('SUPABASE_URL'));
  const authKey =
    readEnv('SUPABASE_ANON_KEY') || readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !authKey) {
    throw new Error(
      'Konfigurasi Supabase Auth belum lengkap. Tambahkan SUPABASE_URL dan SUPABASE_ANON_KEY pada Secrets.'
    );
  }

  return createClient(url, authKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      flowType,
    },
  });
}
