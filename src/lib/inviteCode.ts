import { supabase, isSupabaseConfigured } from './supabase'

export type InviteCodeResult =
  | { valid: true; expiresAt: string }
  | { valid: false; error: string }

export async function validateInviteCode(code: string): Promise<InviteCodeResult> {
  if (!isSupabaseConfigured) {
    return { valid: false, error: 'クラウド接続が設定されていません' }
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .select('code, expires_at, facility_id')
    .ilike('code', code.trim())
    .maybeSingle()

  if (error || !data) return { valid: false, error: '招待コードが見つかりません' }
  if (data.facility_id) return { valid: false, error: 'このコードはすでに使用済みです' }
  if (new Date(data.expires_at) < new Date()) return { valid: false, error: 'このコードの有効期限が切れています' }

  return { valid: true, expiresAt: data.expires_at }
}

export async function consumeInviteCode(code: string, facilityId: string): Promise<void> {
  if (!isSupabaseConfigured) return
  await supabase
    .from('invite_codes')
    .update({ facility_id: facilityId })
    .ilike('code', code.trim())
}
