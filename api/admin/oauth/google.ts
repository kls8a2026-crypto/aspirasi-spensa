import type { Request, Response } from 'express';
import { getSupabaseGoogleOAuthUrl } from '../../../src/db/supabaseQueries.ts';
import { isSupabaseConfigured } from '../../../src/lib/supabase.ts';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error:
        'Konfigurasi Supabase belum lengkap. Tambahkan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY pada Environment Variables Vercel.',
    });
  }

  try {
    const body = (req.body ?? {}) as { redirectTo?: unknown };
    const rawRedirect =
      typeof body.redirectTo === 'string' ? body.redirectTo.trim() : '';
    const originHeader = req.headers.origin;
    const requestOrigin =
      typeof originHeader === 'string' ? originHeader : '';
    const fallbackOrigin =
      requestOrigin || process.env.APP_URL || 'http://localhost:3000';
    const redirectTo = rawRedirect.startsWith('http')
      ? rawRedirect
      : `${fallbackOrigin.replace(/\/+$/, '')}/#admin`;

    const url = await getSupabaseGoogleOAuthUrl(redirectTo);
    return res.status(200).json({ url });
  } catch (error) {
    console.error(
      'Gagal membuat URL OAuth Google:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Gagal menyiapkan login Google melalui Supabase.',
    });
  }
}
