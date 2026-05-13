import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const STYLE_DESC: Record<string, string> = {
  gentle:   'やわらかく親しみやすい文体（保護者に寄り添うトーン）',
  standard: '標準的なおたより文体（保育園・幼稚園らしい丁寧さ）',
  formal:   '丁寧・正式な文体（公式通知として)',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { categories, style, facilityName } = req.body as {
    categories: string[]
    style: string
    facilityName: string
  }

  if (!categories || categories.length === 0) {
    return res.status(400).json({ error: 'カテゴリを1つ以上指定してください' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません。Vercel管理画面で ANTHROPIC_API_KEY を設定してください。' })
  }

  const client = new Anthropic({ apiKey })
  const styleDesc = STYLE_DESC[style] ?? STYLE_DESC['gentle']
  const now = new Date()
  const yearMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`

  const prompt = `あなたは保育園・幼稚園の安全管理担当者です。保護者向け周知文を作成してください。

【施設名】${facilityName || '当園'}
【日付】${yearMonth}
【周知カテゴリ】${categories.join('、')}
【文体】${styleDesc}

【要件】
- 冒頭は「保護者の皆様へ」から始める
- 選択された各カテゴリについて、園で実施している安全対策や保護者へのお願いを具体的に記載する
- 「ご家庭でのお願い」を含める
- 締めの挨拶を入れる
- 末尾は「${yearMonth}\\n${facilityName || '当園'}」で終える
- 全体で400〜600文字程度
- 周知文の本文のみ出力（前置き・説明は不要）`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return res.status(200).json({ text })
}
