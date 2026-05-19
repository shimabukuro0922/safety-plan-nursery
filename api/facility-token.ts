/**
 * Vercel serverless function — 施設コードを検証し、facility_id クレームを含む
 * Supabase 互換 JWT を返す。
 *
 * 必要な環境変数（Vercel Dashboard > Settings > Environment Variables）:
 *   SUPABASE_URL         - Supabase プロジェクト URL
 *   SUPABASE_ANON_KEY    - Supabase anon（公開）キー
 *   SUPABASE_JWT_SECRET  - Supabase JWT secret
 *                          （Supabase Dashboard > Settings > API > JWT Settings > JWT Secret）
 *
 * クライアント側はこのトークンを supabase.auth.setSession() でセットすることで、
 * RLS ポリシー (auth.jwt() ->> 'facility_id') による施設単位アクセス制御が有効になる。
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * HMAC-SHA256 で署名した JWT を生成する（jsonwebtoken パッケージ不要）
 * expiresInSec: 30日（2,592,000秒）
 */
function signJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSec = 30 * 24 * 60 * 60
): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const now = Math.floor(Date.now() / 1000)
  const claims = base64url(
    Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }))
  )
  const signing = `${header}.${claims}`
  const sig = base64url(
    crypto.createHmac('sha256', secret).update(signing).digest()
  )
  return `${signing}.${sig}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (!jwtSecret) {
    // JWT secret が未設定の場合はフォールバックレスポンス（セキュリティ未強化状態を許容）
    return res.status(503).json({ error: 'JWT secret not configured' })
  }

  const { code } = (req.body ?? {}) as { code?: string }
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'facility code required' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase
    .from('facilities')
    .select('id')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'facility not found' })
  }

  const facilityId = data.id as string

  // Supabase RLS が auth.jwt() ->> 'facility_id' で検証できるトークンを生成
  const token = signJWT(
    {
      iss: 'supabase',
      role: 'anon',
      facility_id: facilityId,
    },
    jwtSecret
  )

  return res.status(200).json({ token, facility_id: facilityId })
}
