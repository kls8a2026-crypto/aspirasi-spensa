import { isSupabaseConfigured } from '../lib/supabase.ts';
import type {
  Aspiration,
  CreateAspirationInput,
  MediaAssets,
} from '../types/aspiration.ts';
import {
  deleteAspirationById as deleteAspirationCloudSql,
  getMediaSettings as getMediaSettingsCloudSql,
  insertAspiration as insertAspirationCloudSql,
  insertSampleAspirations as insertSampleAspirationsCloudSql,
  listAllAspirations as listAllAspirationsCloudSql,
  listPublicAspirations as listPublicAspirationsCloudSql,
  updateAspirationReply as updateAspirationReplyCloudSql,
  updateAspirationVisibility as updateAspirationVisibilityCloudSql,
  upsertMediaSettings as upsertMediaSettingsCloudSql,
} from './queries.ts';
import {
  deleteAspirationByIdSupabase,
  getMediaSettingsSupabase,
  insertAspirationSupabase,
  insertSampleAspirationsSupabase,
  isSupabaseTableMissingError,
  listAllAspirationsSupabase,
  listPublicAspirationsSupabase,
  updateAspirationReplySupabase,
  updateAspirationVisibilitySupabase,
  upsertMediaSettingsSupabase,
} from './supabaseQueries.ts';

let supabaseSchemaMissingUntil = 0;

async function runWithSupabaseFallback<T>(
  supabaseFn: () => Promise<T>,
  cloudSqlFn: () => Promise<T>
): Promise<T> {
  if (isSupabaseConfigured() && Date.now() >= supabaseSchemaMissingUntil) {
    try {
      return await supabaseFn();
    } catch (error) {
      if (isSupabaseTableMissingError(error)) {
        supabaseSchemaMissingUntil = Date.now() + 15_000;
        console.info(
          'Supabase tables not initialized yet; serving fallback database until supabase/schema.sql is applied.'
        );
        return cloudSqlFn();
      }
      throw error;
    }
  }
  return cloudSqlFn();
}

export function listPublicAspirations(): Promise<Aspiration[]> {
  return runWithSupabaseFallback(
    listPublicAspirationsSupabase,
    listPublicAspirationsCloudSql
  );
}

export function listAllAspirations(): Promise<Aspiration[]> {
  return runWithSupabaseFallback(
    listAllAspirationsSupabase,
    listAllAspirationsCloudSql
  );
}

export function insertAspiration(
  input: CreateAspirationInput
): Promise<Aspiration> {
  return runWithSupabaseFallback(
    () => insertAspirationSupabase(input),
    () => insertAspirationCloudSql(input)
  );
}

export function updateAspirationVisibility(
  id: string,
  isHidden: boolean
): Promise<Aspiration | null> {
  return runWithSupabaseFallback(
    () => updateAspirationVisibilitySupabase(id, isHidden),
    () => updateAspirationVisibilityCloudSql(id, isHidden)
  );
}

export function updateAspirationReply(
  id: string,
  replyText: string
): Promise<Aspiration | null> {
  return runWithSupabaseFallback(
    () => updateAspirationReplySupabase(id, replyText),
    () => updateAspirationReplyCloudSql(id, replyText)
  );
}

export function deleteAspirationById(id: string): Promise<boolean> {
  return runWithSupabaseFallback(
    () => deleteAspirationByIdSupabase(id),
    () => deleteAspirationCloudSql(id)
  );
}

export function insertSampleAspirations(): Promise<void> {
  return runWithSupabaseFallback(
    insertSampleAspirationsSupabase,
    insertSampleAspirationsCloudSql
  );
}

export function getMediaSettings(): Promise<MediaAssets> {
  return runWithSupabaseFallback(
    getMediaSettingsSupabase,
    getMediaSettingsCloudSql
  );
}

export function upsertMediaSettings(
  assets: MediaAssets
): Promise<MediaAssets> {
  return runWithSupabaseFallback(
    () => upsertMediaSettingsSupabase(assets),
    () => upsertMediaSettingsCloudSql(assets)
  );
}
