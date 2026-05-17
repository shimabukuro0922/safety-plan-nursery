/**
 * Supabase sync helpers — push/pull for each entity.
 * All functions are safe no-ops when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from './supabase'
import type { NearMiss } from '@/types'

// Local interface mirrors (kept in sync with stores — avoids circular imports)
export interface SyncNapCheckRecord {
  id: string
  date: string
  checked_at: string
  checked_by: string
}

export interface SyncTrainingRecord {
  id: string
  staff_name: string
  training_type: string
  completed_date: string
  expiry_date: string | null
  notes: string | null
}

export interface SyncChecklistDone {
  doneItems: Record<string, { done_at: string; done_by: string; notes?: string }>
  lastMarkedMonth: string | null
}

export interface SyncChecklistItemDef {
  id: string
  categoryName: string
  title: string
  description: string
}

export interface SyncChild {
  id: string
  name: string
  className: string
  isPhotoNG: boolean
  ngReason: string | null
  createdAt: string
}

// ==========================================
// Facility
// ==========================================

function generateCode(): string {
  // Excludes ambiguous chars: I O 0 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export async function createFacilityInSupabase(
  name: string,
  directorName: string | null,
  phone: string | null,
  pinHash?: string | null
): Promise<{ id: string; code: string } | null> {
  if (!isSupabaseConfigured) return null
  const code = generateCode()
  try {
    const { data, error } = await supabase
      .from('facilities')
      .insert({ code, name, director_name: directorName, phone, pin_hash: pinHash ?? null })
      .select('id, code')
      .single()
    if (error) throw error
    return data as { id: string; code: string }
  } catch (err) {
    console.error('[sync] createFacility:', err)
    return null
  }
}

export async function getFacilityByCode(code: string): Promise<{
  id: string
  code: string
  name: string
  director_name: string | null
  phone: string | null
  pin_hash: string | null
} | null> {
  if (!isSupabaseConfigured) return null
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, code, name, director_name, phone, pin_hash')
      .eq('code', code.toUpperCase().trim())
      .single()
    if (error) throw error
    return data as { id: string; code: string; name: string; director_name: string | null; phone: string | null; pin_hash: string | null }
  } catch {
    return null
  }
}

/** Supabase の施設レコードの pin_hash を更新（または削除）する */
export async function updateFacilityPIN(
  supabaseId: string,
  pinHash: string | null
): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  try {
    const { error } = await supabase
      .from('facilities')
      .update({ pin_hash: pinHash })
      .eq('id', supabaseId)
    if (error) throw error
    return true
  } catch (err) {
    console.error('[sync] updateFacilityPIN:', err)
    return false
  }
}

// ==========================================
// Near Misses
// ==========================================

export async function pushNearMiss(nm: NearMiss, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('near_misses').upsert({
      id: nm.id,
      facility_id: facilityId,
      occurred_at: nm.occurred_at,
      scene: nm.scene,
      what_happened: nm.what_happened,
      why_it_happened: nm.why_it_happened,
      what_to_change: nm.what_to_change,
      shared_with: nm.shared_with,
      recheck_date: nm.recheck_date,
      step: nm.step,
      created_by: nm.created_by,
    })
  } catch (err) {
    console.error('[sync] pushNearMiss:', err)
  }
}

export async function deleteNearMissRemote(id: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('near_misses').delete().eq('id', id).eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] deleteNearMiss:', err)
  }
}

export async function pullNearMisses(facilityId: string): Promise<NearMiss[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('near_misses')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      facility_id: r.facility_id,
      occurred_at: r.occurred_at,
      scene: r.scene,
      location: r.location ?? null,
      what_happened: r.what_happened,
      why_it_happened: r.why_it_happened,
      what_to_change: r.what_to_change,
      shared_with: r.shared_with,
      recheck_date: r.recheck_date,
      step: r.step,
      created_by: r.created_by,
      created_at: r.created_at ?? new Date().toISOString(),
      updated_at: r.updated_at ?? new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

// ==========================================
// Nap Checks
// ==========================================

export async function pushNapCheck(record: SyncNapCheckRecord, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('nap_checks').upsert({
      id: record.id,
      facility_id: facilityId,
      date: record.date,
      checked_at: record.checked_at,
      checked_by: record.checked_by,
    })
  } catch (err) {
    console.error('[sync] pushNapCheck:', err)
  }
}

export async function pullNapChecks(facilityId: string, date: string): Promise<SyncNapCheckRecord[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('nap_checks')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('date', date)
      .order('checked_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      checked_at: r.checked_at,
      checked_by: r.checked_by,
    }))
  } catch {
    return []
  }
}

/** 直近 days 日分の午睡記録を取得（複数端末で過去の記録を同期するため） */
export async function pullNapChecksRecent(facilityId: string, days = 7): Promise<SyncNapCheckRecord[]> {
  if (!isSupabaseConfigured) return []
  try {
    const since = new Date()
    since.setDate(since.getDate() - (days - 1))
    const sinceStr = since.toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('nap_checks')
      .select('*')
      .eq('facility_id', facilityId)
      .gte('date', sinceStr)
      .order('checked_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      checked_at: r.checked_at,
      checked_by: r.checked_by,
    }))
  } catch {
    return []
  }
}

export function subscribeToNapChecks(
  facilityId: string,
  _date: string,  // 後方互換のため残すが内部では使用しない（コールバック側で動的に判定）
  onInsert: (record: SyncNapCheckRecord) => void
): () => void {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel(`nap_checks_${facilityId}_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'nap_checks',
        filter: `facility_id=eq.${facilityId}`,
      },
      (payload) => {
        const r = payload.new as Record<string, string>
        // 日付フィルターをコールバック受信時に動的に計算（深夜0時越え対応）
        const currentDay = new Date().toISOString().split('T')[0]
        if (r.date === currentDay) {
          onInsert({ id: r.id, date: r.date, checked_at: r.checked_at, checked_by: r.checked_by })
        }
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

// ==========================================
// Staff Training
// ==========================================

export async function pushTrainingRecord(record: SyncTrainingRecord, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('staff_training').upsert({
      id: record.id,
      facility_id: facilityId,
      staff_name: record.staff_name,
      training_type: record.training_type,
      completed_date: record.completed_date,
      expiry_date: record.expiry_date,
      notes: record.notes,
    })
  } catch (err) {
    console.error('[sync] pushTrainingRecord:', err)
  }
}

export async function deleteTrainingRecordRemote(id: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('staff_training').delete().eq('id', id).eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] deleteTrainingRecord:', err)
  }
}

export async function pullTrainingRecords(facilityId: string): Promise<SyncTrainingRecord[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('staff_training')
      .select('*')
      .eq('facility_id', facilityId)
      .order('completed_date', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      staff_name: r.staff_name,
      training_type: r.training_type,
      completed_date: r.completed_date,
      expiry_date: r.expiry_date,
      notes: r.notes,
    }))
  } catch {
    return []
  }
}

// ==========================================
// Checklist Done
// ==========================================

export async function pushChecklistDone(
  doneItems: Record<string, { done_at: string; done_by: string; notes?: string }>,
  facilityId: string,
  lastMarkedMonth: string | null
): Promise<void> {
  if (!isSupabaseConfigured) return
  const rows = Object.entries(doneItems).map(([itemId, val]) => ({
    facility_id: facilityId,
    item_id: itemId,
    done_at: val.done_at,
    done_by: val.done_by,
    notes: val.notes ?? null,
    last_marked_month: lastMarkedMonth,
  }))
  if (rows.length === 0) return
  try {
    await supabase
      .from('checklist_done')
      .upsert(rows, { onConflict: 'facility_id,item_id' })
  } catch (err) {
    console.error('[sync] pushChecklistDone:', err)
  }
}

/** 特定の実施済み項目をSupabaseから削除（チェック取り消し時） */
export async function deleteChecklistDoneItem(facilityId: string, itemId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('checklist_done').delete()
      .eq('facility_id', facilityId)
      .eq('item_id', itemId)
  } catch (err) {
    console.error('[sync] deleteChecklistDoneItem:', err)
  }
}

/** 施設の実施済み項目を全件削除（月次リセット時） */
export async function clearChecklistDoneRemote(facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('checklist_done').delete().eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] clearChecklistDone:', err)
  }
}

/** 指定日の午睡記録を全件削除（日次クリア時） */
export async function clearNapChecksForDateRemote(facilityId: string, date: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('nap_checks').delete()
      .eq('facility_id', facilityId)
      .eq('date', date)
  } catch (err) {
    console.error('[sync] clearNapChecksForDate:', err)
  }
}

export async function pullChecklistDone(facilityId: string): Promise<SyncChecklistDone> {
  if (!isSupabaseConfigured) return { doneItems: {}, lastMarkedMonth: null }
  try {
    const { data, error } = await supabase
      .from('checklist_done')
      .select('*')
      .eq('facility_id', facilityId)
    if (error) throw error
    const doneItems: Record<string, { done_at: string; done_by: string; notes?: string }> = {}
    let lastMarkedMonth: string | null = null
    for (const r of data ?? []) {
      doneItems[r.item_id] = {
        done_at: r.done_at,
        done_by: r.done_by,
        notes: r.notes ?? undefined,
      }
      if (r.last_marked_month) lastMarkedMonth = r.last_marked_month
    }
    return { doneItems, lastMarkedMonth }
  } catch {
    return { doneItems: {}, lastMarkedMonth: null }
  }
}

// ==========================================
// Checklist Items
// ==========================================

export async function pushChecklistItems(items: SyncChecklistItemDef[], facilityId: string): Promise<void> {
  if (!isSupabaseConfigured || items.length === 0) return
  try {
    // upsert で処理（delete→insert の2ステップを避け、途中クラッシュでデータが消えるのを防ぐ）
    await supabase.from('checklist_items').upsert(
      items.map((item) => ({
        id: item.id,
        facility_id: facilityId,
        category_name: item.categoryName,
        title: item.title,
        description: item.description,
      })),
      { onConflict: 'id' }
    )
    // 削除されたアイテムをリモートからも除去
    const currentIds = items.map((i) => i.id)
    const { data: remoteItems } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('facility_id', facilityId)
    const toDelete = (remoteItems ?? []).map((r: { id: string }) => r.id).filter((id: string) => !currentIds.includes(id))
    if (toDelete.length > 0) {
      await supabase.from('checklist_items').delete().in('id', toDelete).eq('facility_id', facilityId)
    }
  } catch (err) {
    console.error('[sync] pushChecklistItems:', err)
  }
}

export async function pullChecklistItems(facilityId: string): Promise<SyncChecklistItemDef[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('facility_id', facilityId)
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      categoryName: r.category_name,
      title: r.title,
      description: r.description,
    }))
  } catch {
    return []
  }
}

// ==========================================
// Seasonal Checklist Done
// ==========================================

export interface SyncSeasonalDoneItem {
  item_key: string
  done_at: string
  done_by: string
}

/** 季節チェック：完了済みをすべてupsert */
export async function pushSeasonalDone(
  doneItems: Record<string, { done_at: string; done_by: string }>,
  facilityId: string
): Promise<void> {
  if (!isSupabaseConfigured) return
  const rows = Object.entries(doneItems).map(([item_key, val]) => ({
    facility_id: facilityId,
    item_key,
    done_at: val.done_at,
    done_by: val.done_by,
  }))
  if (rows.length === 0) return
  try {
    await supabase
      .from('seasonal_checklist_done')
      .upsert(rows, { onConflict: 'facility_id,item_key' })
  } catch (err) {
    console.error('[sync] pushSeasonalDone:', err)
  }
}

/** 季節チェック：1件削除（チェック取り消し時） */
export async function deleteSeasonalDoneItem(facilityId: string, itemKey: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('seasonal_checklist_done').delete()
      .eq('facility_id', facilityId)
      .eq('item_key', itemKey)
  } catch (err) {
    console.error('[sync] deleteSeasonalDoneItem:', err)
  }
}

/** 季節チェック：全件取得 */
export async function pullSeasonalDone(
  facilityId: string
): Promise<Record<string, { done_at: string; done_by: string }>> {
  if (!isSupabaseConfigured) return {}
  try {
    const { data, error } = await supabase
      .from('seasonal_checklist_done')
      .select('item_key, done_at, done_by')
      .eq('facility_id', facilityId)
    if (error) throw error
    const result: Record<string, { done_at: string; done_by: string }> = {}
    for (const r of data ?? []) {
      result[r.item_key] = { done_at: r.done_at, done_by: r.done_by }
    }
    return result
  } catch {
    return {}
  }
}

// ==========================================
// Annual Plans
// ==========================================

export interface SyncAnnualPlanMonth {
  month: number
  themes: string[]
  highRisk: string[]
}

/** 年間計画：1ヶ月分をupsert（月の編集時） */
export async function pushAnnualPlanMonth(
  plan: SyncAnnualPlanMonth,
  facilityId: string
): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase
      .from('annual_plans')
      .upsert(
        { facility_id: facilityId, month: plan.month, themes: plan.themes, high_risk: plan.highRisk },
        { onConflict: 'facility_id,month' }
      )
  } catch (err) {
    console.error('[sync] pushAnnualPlanMonth:', err)
  }
}

/** 年間計画：全12ヶ月をまとめてupsert（リセット時） */
export async function pushAnnualPlans(
  plans: SyncAnnualPlanMonth[],
  facilityId: string
): Promise<void> {
  if (!isSupabaseConfigured || plans.length === 0) return
  try {
    await supabase
      .from('annual_plans')
      .upsert(
        plans.map((p) => ({ facility_id: facilityId, month: p.month, themes: p.themes, high_risk: p.highRisk })),
        { onConflict: 'facility_id,month' }
      )
  } catch (err) {
    console.error('[sync] pushAnnualPlans:', err)
  }
}

/** 年間計画：全件取得 */
export async function pullAnnualPlans(facilityId: string): Promise<SyncAnnualPlanMonth[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('annual_plans')
      .select('month, themes, high_risk')
      .eq('facility_id', facilityId)
      .order('month', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => ({
      month: r.month,
      themes: (r.themes as string[]) ?? [],
      highRisk: (r.high_risk as string[]) ?? [],
    }))
  } catch {
    return []
  }
}

// ==========================================
// Children
// ==========================================

export async function pushChild(child: SyncChild, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('children').upsert({
      id: child.id,
      facility_id: facilityId,
      name: child.name,
      class_name: child.className,
      is_photo_ng: child.isPhotoNG,
      ng_reason: child.ngReason,
    })
  } catch (err) {
    console.error('[sync] pushChild:', err)
  }
}

export async function deleteChildRemote(id: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('children').delete().eq('id', id).eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] deleteChild:', err)
  }
}

export async function pullChildren(facilityId: string): Promise<SyncChild[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('facility_id', facilityId)
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      className: r.class_name,
      isPhotoNG: r.is_photo_ng ?? false,
      ngReason: r.ng_reason ?? null,
      createdAt: r.created_at ?? new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

// ==========================================
// Photo Events
// ==========================================

export interface SyncPhotoEvent {
  id: string
  name: string
  date: string
  className: string
  notes: string
  createdAt: string
}

export async function pushPhotoEvent(event: SyncPhotoEvent, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('photo_events').upsert({
      id: event.id,
      facility_id: facilityId,
      name: event.name,
      date: event.date,
      class_name: event.className,
      notes: event.notes,
      created_at: event.createdAt,
    }, { onConflict: 'id' })
  } catch (err) {
    console.error('[sync] pushPhotoEvent:', err)
  }
}

export async function deletePhotoEventRemote(id: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('photo_events').delete().eq('id', id).eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] deletePhotoEvent:', err)
  }
}

export async function pullPhotoEvents(facilityId: string): Promise<SyncPhotoEvent[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('photo_events')
      .select('*')
      .eq('facility_id', facilityId)
      .order('date', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      date: r.date,
      className: r.class_name,
      notes: r.notes ?? '',
      createdAt: r.created_at ?? new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

// ==========================================
// Photo Meta
// ==========================================

export interface SyncPhotoMeta {
  id: string
  eventId: string
  filename: string
  takenAt: string
  taggedChildIds: string[]
  hasNGChild: boolean
  status: string
  rejectedReason: string | null
  thumbnailDataUrl: string
  storageUrl: string | null
  uploadedAt: string
}

export async function pushPhotoMeta(photo: SyncPhotoMeta, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('photo_meta').upsert({
      id: photo.id,
      facility_id: facilityId,
      event_id: photo.eventId,
      filename: photo.filename,
      taken_at: photo.takenAt,
      tagged_child_ids: photo.taggedChildIds,
      has_ng_child: photo.hasNGChild,
      status: photo.status,
      rejected_reason: photo.rejectedReason,
      thumbnail_data_url: photo.thumbnailDataUrl,
      storage_url: photo.storageUrl,
      uploaded_at: photo.uploadedAt,
    }, { onConflict: 'id' })
  } catch (err) {
    console.error('[sync] pushPhotoMeta:', err)
  }
}

export async function deletePhotoMetaRemote(id: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('photo_meta').delete().eq('id', id).eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] deletePhotoMeta:', err)
  }
}

/** イベント削除時：紐づく写真メタをリモートから全件削除 */
export async function deletePhotoMetaByEventRemote(eventId: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('photo_meta').delete().eq('event_id', eventId).eq('facility_id', facilityId)
  } catch (err) {
    console.error('[sync] deletePhotoMetaByEvent:', err)
  }
}

export async function pullPhotoMeta(facilityId: string): Promise<SyncPhotoMeta[]> {
  if (!isSupabaseConfigured) return []
  try {
    const { data, error } = await supabase
      .from('photo_meta')
      .select('*')
      .eq('facility_id', facilityId)
      .order('uploaded_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      eventId: r.event_id,
      filename: r.filename,
      takenAt: r.taken_at,
      taggedChildIds: (r.tagged_child_ids as string[]) ?? [],
      hasNGChild: r.has_ng_child ?? false,
      status: r.status,
      rejectedReason: r.rejected_reason ?? null,
      thumbnailDataUrl: r.thumbnail_data_url ?? '',
      storageUrl: r.storage_url ?? null,
      uploadedAt: r.uploaded_at,
    }))
  } catch {
    return []
  }
}
