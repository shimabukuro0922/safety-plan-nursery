/**
 * Supabase Storage helpers for photo files.
 * Bucket: "photos"  Path pattern: {facilityId}/{photoId}
 *
 * Falls back gracefully when Supabase is not configured (offline / local-only mode).
 */
import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET = 'photos'

/**
 * 写真ファイルを Supabase Storage にアップロードし、公開 URL を返す。
 * 失敗した場合は null を返す（IndexedDB フォールバック側で対応）。
 */
export async function uploadPhotoToSupabase(
  photoId: string,
  facilityId: string,
  blob: Blob
): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  try {
    const path = `${facilityId}/${photoId}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('[photoStorage] upload failed:', err)
    return null
  }
}

/**
 * Supabase Storage から写真ファイルを削除する。
 * 失敗してもエラーを伝播しない（ベストエフォート）。
 */
export async function deletePhotoFromSupabase(
  photoId: string,
  facilityId: string
): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.storage
      .from(BUCKET)
      .remove([`${facilityId}/${photoId}`])
  } catch (err) {
    console.error('[photoStorage] delete failed:', err)
  }
}
