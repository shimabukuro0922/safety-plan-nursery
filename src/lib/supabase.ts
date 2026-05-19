import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,      // セッションの localStorage 永続化はアプリ側で管理
    autoRefreshToken: false,    // トークン自動更新は行わない（長期 JWT を使用）
    detectSessionInUrl: false,  // OAuth コールバック不使用
  },
})

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 10

/**
 * 施設 JWT を Supabase セッションとして設定する。
 * 以降の PostgREST リクエストに Authorization: Bearer <token> が付与され、
 * RLS ポリシー（auth.jwt() ->> 'facility_id'）による施設単位アクセス制御が有効になる。
 */
export async function setFacilityAuth(token: string): Promise<void> {
  await supabase.auth.setSession({ access_token: token, refresh_token: '' })
}

/** 施設認証をクリアする（ログアウト・施設切り替え時） */
export async function clearFacilityAuth(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' })
}
