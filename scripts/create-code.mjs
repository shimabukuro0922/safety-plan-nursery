/**
 * 招待コード発行スクリプト
 *
 * 使い方:
 *   node scripts/create-code.mjs "園名・メモ" [日数]
 *
 * 例:
 *   node scripts/create-code.mjs "さくら保育園 田中様" 30
 *   node scripts/create-code.mjs "ひまわり保育園" 60
 *
 * 環境変数（.env.local に記載）:
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY=eyJ...（サービスロールキー）
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 接続情報（.env.local から直接コピー）
const url = 'https://yjfgbqjrzmimpegbwiwl.supabase.co'
const key = 'sb_publishable_ZA2Emut38v4hf-G-4fkt7g_kUCNQVki'

const supabase = createClient(url, key)

const note = process.argv[2] ?? ''
const days = parseInt(process.argv[3] ?? '30', 10)

// ランダムな8文字の英数字コードを生成
const code = Math.random().toString(36).substring(2, 6).toUpperCase() +
             Math.random().toString(36).substring(2, 6).toUpperCase()

const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

const { error } = await supabase
  .from('invite_codes')
  .insert({ code, expires_at: expiresAt, note })

if (error) {
  console.error('❌ エラー:', error.message)
  process.exit(1)
}

console.log('✅ 招待コードを発行しました')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📋 コード　　: ${code}`)
console.log(`📅 有効期限　: ${new Date(expiresAt).toLocaleDateString('ja-JP')} まで（${days}日間）`)
if (note) console.log(`📝 メモ　　　: ${note}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('このコードをメールでお送りください。')
