import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  DEFAULT_MEDIA_ASSETS,
  SAMPLE_ASPIRATIONS,
} from '../config/appConfig.ts';
import type {
  Aspiration,
  AspirationCategory,
  CreateAspirationInput,
  MediaAssets,
} from '../types/aspiration.ts';
import { db } from './index.ts';
import { aspirations, mediaSettings } from './schema.ts';

const MEDIA_ROW_ID = 'media';

function mapRowToAspiration(row: typeof aspirations.$inferSelect): Aspiration {
  const item: Aspiration = {
    id: row.id,
    category: row.category as AspirationCategory,
    message: row.message,
    author: row.author,
    createdAt: row.createdAt.toISOString(),
    isHidden: row.isHidden,
    isSample: row.isSample,
  };

  if (row.adminReply && row.adminReply.trim()) {
    item.adminReply = row.adminReply;
    item.adminRepliedAt = row.adminRepliedAt
      ? row.adminRepliedAt.toISOString()
      : undefined;
  }

  return item;
}

export async function listPublicAspirations(): Promise<Aspiration[]> {
  try {
    const rows = await db
      .select()
      .from(aspirations)
      .where(eq(aspirations.isHidden, false))
      .orderBy(desc(aspirations.createdAt));
    return rows.map(mapRowToAspiration);
  } catch (error) {
    console.error('Database query failed in listPublicAspirations:', error);
    throw new Error('Gagal memuat daftar aspirasi publik.', { cause: error });
  }
}

export async function listAllAspirations(): Promise<Aspiration[]> {
  try {
    const rows = await db
      .select()
      .from(aspirations)
      .orderBy(desc(aspirations.createdAt));
    return rows.map(mapRowToAspiration);
  } catch (error) {
    console.error('Database query failed in listAllAspirations:', error);
    throw new Error('Gagal memuat seluruh daftar aspirasi.', { cause: error });
  }
}

export async function insertAspiration(
  input: CreateAspirationInput
): Promise<Aspiration> {
  try {
    const id = randomUUID();
    const author =
      input.author && input.author.trim().length > 0
        ? input.author.trim()
        : 'Anonim';
    const [inserted] = await db
      .insert(aspirations)
      .values({
        id,
        category: input.category,
        message: input.message.trim(),
        author,
        isHidden: false,
        isSample: false,
      })
      .returning();

    return mapRowToAspiration(inserted);
  } catch (error) {
    console.error('Database query failed in insertAspiration:', error);
    throw new Error('Gagal menyimpan aspirasi ke database.', { cause: error });
  }
}

export async function updateAspirationVisibility(
  id: string,
  isHidden: boolean
): Promise<Aspiration | null> {
  try {
    const [updated] = await db
      .update(aspirations)
      .set({ isHidden })
      .where(eq(aspirations.id, id))
      .returning();
    return updated ? mapRowToAspiration(updated) : null;
  } catch (error) {
    console.error('Database query failed in updateAspirationVisibility:', error);
    throw new Error('Gagal memperbarui visibilitas aspirasi.', {
      cause: error,
    });
  }
}

export async function updateAspirationReply(
  id: string,
  replyText: string
): Promise<Aspiration | null> {
  try {
    const trimmed = replyText.trim();
    const [updated] = await db
      .update(aspirations)
      .set(
        trimmed
          ? { adminReply: trimmed, adminRepliedAt: new Date() }
          : { adminReply: null, adminRepliedAt: null }
      )
      .where(eq(aspirations.id, id))
      .returning();
    return updated ? mapRowToAspiration(updated) : null;
  } catch (error) {
    console.error('Database query failed in updateAspirationReply:', error);
    throw new Error('Gagal memperbarui tanggapan admin.', { cause: error });
  }
}

export async function deleteAspirationById(id: string): Promise<boolean> {
  try {
    const deleted = await db
      .delete(aspirations)
      .where(eq(aspirations.id, id))
      .returning({ id: aspirations.id });
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteAspirationById:', error);
    throw new Error('Gagal menghapus aspirasi.', { cause: error });
  }
}

export async function insertSampleAspirations(): Promise<void> {
  try {
    for (const sample of SAMPLE_ASPIRATIONS) {
      await db
        .insert(aspirations)
        .values({
          id: sample.id,
          category: sample.category,
          message: sample.message,
          author: sample.author,
          createdAt: new Date(sample.createdAt),
          isHidden: false,
          isSample: true,
          adminReply: sample.adminReply ?? null,
          adminRepliedAt: sample.adminRepliedAt
            ? new Date(sample.adminRepliedAt)
            : null,
        })
        .onConflictDoUpdate({
          target: aspirations.id,
          set: {
            category: sample.category,
            message: sample.message,
            author: sample.author,
            isHidden: false,
            isSample: true,
            adminReply: sample.adminReply ?? null,
            adminRepliedAt: sample.adminRepliedAt
              ? new Date(sample.adminRepliedAt)
              : null,
          },
        });
    }
  } catch (error) {
    console.error('Database query failed in insertSampleAspirations:', error);
    throw new Error('Gagal memuat aspirasi contoh.', { cause: error });
  }
}

export async function getMediaSettings(): Promise<MediaAssets> {
  try {
    const [row] = await db
      .select()
      .from(mediaSettings)
      .where(eq(mediaSettings.id, MEDIA_ROW_ID))
      .limit(1);

    if (!row) {
      return DEFAULT_MEDIA_ASSETS;
    }

    return {
      schoolLogoUrl:
        typeof row.schoolLogoUrl === 'string' && row.schoolLogoUrl.length > 0
          ? row.schoolLogoUrl
          : null,
      exploreGalleryUrls:
        Array.isArray(row.exploreGalleryUrls) &&
        row.exploreGalleryUrls.length > 0
          ? row.exploreGalleryUrls
          : DEFAULT_MEDIA_ASSETS.exploreGalleryUrls,
      writeGalleryUrls:
        Array.isArray(row.writeGalleryUrls) && row.writeGalleryUrls.length > 0
          ? row.writeGalleryUrls
          : DEFAULT_MEDIA_ASSETS.writeGalleryUrls,
    };
  } catch (error) {
    console.error('Database query failed in getMediaSettings:', error);
    throw new Error('Gagal memuat pengaturan media.', { cause: error });
  }
}

export async function upsertMediaSettings(
  assets: MediaAssets
): Promise<MediaAssets> {
  try {
    const exploreUrls =
      assets.exploreGalleryUrls.length > 0
        ? assets.exploreGalleryUrls.slice(0, 10)
        : DEFAULT_MEDIA_ASSETS.exploreGalleryUrls;
    const writeUrls =
      assets.writeGalleryUrls.length > 0
        ? assets.writeGalleryUrls.slice(0, 10)
        : DEFAULT_MEDIA_ASSETS.writeGalleryUrls;

    const [saved] = await db
      .insert(mediaSettings)
      .values({
        id: MEDIA_ROW_ID,
        schoolLogoUrl: assets.schoolLogoUrl ?? null,
        exploreGalleryUrls: exploreUrls,
        writeGalleryUrls: writeUrls,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mediaSettings.id,
        set: {
          schoolLogoUrl: assets.schoolLogoUrl ?? null,
          exploreGalleryUrls: exploreUrls,
          writeGalleryUrls: writeUrls,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      schoolLogoUrl: saved.schoolLogoUrl ?? null,
      exploreGalleryUrls: saved.exploreGalleryUrls,
      writeGalleryUrls: saved.writeGalleryUrls,
    };
  } catch (error) {
    console.error('Database query failed in upsertMediaSettings:', error);
    throw new Error('Gagal menyimpan pengaturan media.', { cause: error });
  }
}
