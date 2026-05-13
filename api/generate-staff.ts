import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const TYPE_DESC: Record<string, string> = {
  morning:  '朝礼用1枚資料（毎朝職員が確認するA4一枚の安全チェック）',
  training: '園内研修用資料（詳細な解説と演習内容を含む研修シート）',
  newcomer: '新人職員向けガイド（最初に覚えるべき安全の基礎知識）',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { typeKey, typeLabel, theme } = req.body as {
    typeKey: string
    typeLabel: string
    theme: string
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません。Vercel管理画面で ANTHROPIC_API_KEY を設定してください。' })
  }

  const client = new Anthropic({ apiKey })
  const typeDesc = TYPE_DESC[typeKey] ?? `「${typeLabel}」用の職員向け安全資料`
  const themeNote = theme ? `\n【今回のテーマ】${theme}` : ''

  const prompt = `あなたは保育園・幼稚園の安全管理の専門家です。職員向け安全管理資料を作成してください。

【資料の種類】${typeDesc}${themeNote}

【要件】
- テーマが指定されている場合はその内容を中心にする
- テーマがない場合は保育施設の一般的な安全管理内容にする
- 見出し・チェックリスト・箇条書きを使って読みやすく構成する
- 職員がすぐに実践できる具体的な内容にする
- 400〜600文字程度
- 資料の本文のみ出力（前置き・説明は不要）`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return res.status(200).json({ text })
}
