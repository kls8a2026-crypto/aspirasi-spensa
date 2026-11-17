import * as dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASPIRATION_CATEGORIES,
  FORM_LIMITS,
  resolveAdminLoginEmail,
} from './src/config/appConfig.ts';
import {
  deleteAspirationById,
  getMediaSettings,
  insertAspiration,
  insertSampleAspirations,
  listAllAspirations,
  listPublicAspirations,
  updateAspirationReply,
  updateAspirationVisibility,
  upsertMediaSettings,
} from './src/db/repository.ts';
import {
  getSupabaseGoogleOAuthUrl,
  signInSupabaseAdmin,
} from './src/db/supabaseQueries.ts';
import { isSupabaseConfigured } from './src/lib/supabase.ts';
import {
  type AuthRequest,
  requireAdmin,
  requireAuth,
} from './src/middleware/auth.ts';
import type { AspirationCategory, MediaAssets } from './src/types/aspiration.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  // --- Public Routes ---

  app.get('/api/aspirations', async (_req, res) => {
    try {
      const items = await listPublicAspirations();
      res.json(items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Gagal memuat aspirasi.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/aspirations', async (req, res) => {
    try {
      const body = req.body as {
        category?: unknown;
        message?: unknown;
        author?: unknown;
      };

      const category =
        typeof body.category === 'string' ? body.category.trim() : '';
      if (!ASPIRATION_CATEGORIES.includes(category as AspirationCategory)) {
        res.status(400).json({ error: 'Kategori aspirasi tidak valid.' });
        return;
      }

      const message =
        typeof body.message === 'string'
          ? body.message.trim().slice(0, FORM_LIMITS.maxMessageLength)
          : '';
      if (message.length < FORM_LIMITS.minMessageLength) {
        res.status(400).json({
          error: `Isi aspirasi minimal ${FORM_LIMITS.minMessageLength} karakter.`,
        });
        return;
      }

      const rawAuthor =
        typeof body.author === 'string'
          ? body.author.trim().slice(0, FORM_LIMITS.maxAuthorLength)
          : '';
      const author = rawAuthor.length > 0 ? rawAuthor : 'Anonim';

      const created = await insertAspiration({
        category: category as AspirationCategory,
        message,
        author,
      });
      res.status(201).json(created);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Gagal menyimpan aspirasi.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/settings/media', async (_req, res) => {
    try {
      const assets = await getMediaSettings();
      res.json(assets);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Gagal memuat pengaturan media.';
      res.status(500).json({ error: message });
    }
  });

  // --- Authenticated Admin Routes (Supabase Auth) ---

  app.post('/api/admin/login', async (req, res) => {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        error:
          'Konfigurasi Supabase belum lengkap. Tambahkan SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY pada Secrets.',
      });
      return;
    }

    try {
      const body = req.body as {
        username?: unknown;
        password?: unknown;
      };
      const rawUsername =
        typeof body.username === 'string' ? body.username.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!rawUsername || !password) {
        res.status(400).json({
          error: 'Masukkan username atau email dan password admin.',
        });
        return;
      }

      const email = resolveAdminLoginEmail(rawUsername);
      const result = await signInSupabaseAdmin(email, password);

      if (!result.isAdmin) {
        res.status(403).json({
          error: 'Akun ini belum terdaftar sebagai Admin.',
        });
        return;
      }

      res.json({
        accessToken: result.accessToken,
        user: {
          uid: result.uid,
          email: result.email,
          isAdmin: true,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Username atau password admin tidak sesuai.';
      res.status(401).json({ error: message });
    }
  });

  app.post('/api/admin/oauth/google', async (req, res) => {
    if (!isSupabaseConfigured()) {
      res.status(503).json({
        error:
          'Konfigurasi Supabase belum lengkap. Tambahkan SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY pada Secrets.',
      });
      return;
    }

    try {
      const body = req.body as { redirectTo?: unknown };
      const rawRedirect =
        typeof body.redirectTo === 'string' ? body.redirectTo.trim() : '';
      const fallbackOrigin =
        typeof req.headers.origin === 'string' && req.headers.origin
          ? req.headers.origin
          : process.env.APP_URL || `http://localhost:${port}`;
      const redirectTo = rawRedirect.startsWith('http')
        ? rawRedirect
        : `${fallbackOrigin.replace(/\/+$/, '')}/#admin`;

      const url = await getSupabaseGoogleOAuthUrl(redirectTo);
      res.json({ url });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gagal menyiapkan login Google melalui Supabase.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/admin/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      uid: req.dbUser?.uid ?? '',
      email: req.dbUser?.email ?? '',
      isAdmin: Boolean(req.dbUser?.isAdmin),
    });
  });

  app.get(
    '/api/admin/aspirations',
    requireAuth,
    requireAdmin,
    async (_req, res) => {
      try {
        const items = await listAllAspirations();
        res.json(items);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Gagal memuat aspirasi.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.patch(
    '/api/admin/aspirations/:id/visibility',
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const id = req.params.id;
        const { isHidden } = req.body as { isHidden?: unknown };
        if (typeof isHidden !== 'boolean') {
          res.status(400).json({ error: 'Parameter isHidden harus boolean.' });
          return;
        }
        const updated = await updateAspirationVisibility(id, isHidden);
        if (!updated) {
          res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
          return;
        }
        res.json(updated);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal mengubah visibilitas aspirasi.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.patch(
    '/api/admin/aspirations/:id/reply',
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const id = req.params.id;
        const { reply } = req.body as { reply?: unknown };
        if (typeof reply !== 'string') {
          res.status(400).json({ error: 'Tanggapan harus berupa teks.' });
          return;
        }
        const updated = await updateAspirationReply(id, reply.slice(0, 400));
        if (!updated) {
          res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
          return;
        }
        res.json(updated);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan tanggapan admin.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    '/api/admin/aspirations/:id',
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const id = req.params.id;
        const deleted = await deleteAspirationById(id);
        if (!deleted) {
          res.status(404).json({ error: 'Aspirasi tidak ditemukan.' });
          return;
        }
        res.status(204).end();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Gagal menghapus aspirasi.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    '/api/admin/aspirations/seed',
    requireAuth,
    requireAdmin,
    async (_req, res) => {
      try {
        await insertSampleAspirations();
        const items = await listAllAspirations();
        res.status(201).json(items);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal memuat aspirasi contoh.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.put(
    '/api/admin/settings/media',
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const body = req.body as Partial<MediaAssets>;
        const schoolLogoUrl =
          typeof body.schoolLogoUrl === 'string' &&
          body.schoolLogoUrl.length > 0 &&
          body.schoolLogoUrl.length <= 350000
            ? body.schoolLogoUrl
            : null;

        const exploreGalleryUrls = Array.isArray(body.exploreGalleryUrls)
          ? body.exploreGalleryUrls
              .filter(
                (u): u is string =>
                  typeof u === 'string' && u.length > 0 && u.length <= 350000
              )
              .slice(0, 10)
          : [];

        const writeGalleryUrls = Array.isArray(body.writeGalleryUrls)
          ? body.writeGalleryUrls
              .filter(
                (u): u is string =>
                  typeof u === 'string' && u.length > 0 && u.length <= 350000
              )
              .slice(0, 10)
          : [];

        if (exploreGalleryUrls.length === 0 || writeGalleryUrls.length === 0) {
          res.status(400).json({
            error: 'Setiap galeri harus memiliki minimal 1 foto valid.',
          });
          return;
        }

        const saved = await upsertMediaSettings({
          schoolLogoUrl,
          exploreGalleryUrls,
          writeGalleryUrls,
        });
        res.json(saved);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Gagal menyimpan pengaturan media.';
        res.status(500).json({ error: message });
      }
    }
  );

  // --- Vite Middleware (Dev) / Static Files (Prod) ---

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
