import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

// Vercel関数のタイムアウトを30秒に延長
export const config = { maxDuration: 30 }

const STYLE_DESC: Record<string, string> = {
  gentle:   'やわらかく親しみやすい文体。保護者に寄り添い、温かみのある表現を使う。',
  standard: '標準的なおたより文体。保育園・幼稚園らしい丁寧で読みやすい文章。',
  formal:   '丁寧・正式な文体。公式通知として品格のある表現を使う。',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { categories, style, facilityName } = req.body as {
    categories: { name: string; theme?: string }[]
    style: string
    facilityName: string
  }

  if (!categories || categories.length === 0) {
    return res.status(400).json({ error: 'カテゴリを1つ以上指定してください' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' })
  }

  const client = new Anthropic({ apiKey })
  const styleDesc = STYLE_DESC[style] ?? STYLE_DESC['gentle']
  const now = new Date()
  const yearMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`

  // カテゴリとテーマを整形
  const categoryBlock = categories.map((c) => {
    if (c.theme) {
      return `・${c.name}\n  （補足・テーマ：${c.theme}）`
    }
    return `・${c.name}`
  }).join('\n')

  const prompt = `あなたは保育園・幼稚園の安全管理担当者です。保護者向け周知文（おたより）を作成してください。

【施設名】${facilityName || '当園'}
【日付】${yearMonth}
【文体】${styleDesc}

【周知カテゴリと補足内容】
${categoryBlock}

【作成ルール】
1. 冒頭は「保護者の皆様へ」で始める
2. 書き出しに季節感や時候の挨拶を一言添える
3. 各カテゴリについて以下を含めて丁寧に記述する：
   - 園で取り組んでいる具体的な安全対策・活動内容
   - 保護者へのお願いや家庭でできる協力事項
   - 補足テーマがある場合はその内容を反映する
4. 「ご家庭でのお願い」や「保護者と園が一緒に取り組む姿勢」を強調する
5. 締めの言葉は「子どもたちの安全を守るため、職員一同取り組んでまいります」などの前向きな表現
6. 末尾は「${yearMonth} ${facilityName || '当園'}」で終える
7. 全体で600〜900文字程度でしっかりとした内容にする
8. 周知文の本文のみ出力（前置き・説明・タイトルは不要）`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return res.status(200).json({ text })
  } catch (err: unknown) {
    console.error('[generate-notice] Anthropic API error:', err)
    const message = err instanceof Error ? err.message : '不明なエラー'
    return res.status(500).json({ error: `AI生成に失敗しました: ${message}` })
  }
}
