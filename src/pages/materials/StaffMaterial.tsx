import React, { useState, useRef } from 'react'
import { Sparkles, FileDown, Users, BookOpen, UserPlus, RotateCcw, Pencil } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import toast from 'react-hot-toast'

type MaterialType = 'morning' | 'training' | 'newcomer'

const MATERIAL_TYPES: { key: MaterialType; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'morning', label: '朝礼用1枚資料', icon: <BookOpen size={18} className="text-blue-500" />, description: '毎朝の安全確認事項をA4一枚にまとめたもの' },
  { key: 'training', label: '園内研修用資料', icon: <Users size={18} className="text-green-500" />, description: '定期研修で使える詳細な解説・演習シート' },
  { key: 'newcomer', label: '新人向けガイド', icon: <UserPlus size={18} className="text-purple-500" />, description: '新入職員が最初に学ぶ安全の基礎' },
]

const THEME_EXAMPLES = ['午睡時の見守り', '誤嚥の初動対応', 'AEDの使い方', '新年度の安全確認']

const THEME_PLACEHOLDERS = [
  '例：午睡時の呼吸確認',
  '例：誤嚥時の初動対応',
  '例：AEDの使い方を新人向けに',
  '例：新年度の安全確認ポイント',
]

const buildDemoContent = (type: MaterialType, theme: string): string => {
  const themeHeader = theme ? `▼ ${theme} についての資料\n\n` : ''
  const themeNote = theme ? `\n【テーマ：${theme}】` : ''

  const base: Record<MaterialType, string> = {
    morning: `${themeHeader}【本日の安全確認ポイント】${themeNote}

✅ 午睡確認
・5分ごとに呼吸・体位を確認
・うつぶせ寝を発見したら仰向けに直す

✅ 食事・誤嚥対策
・アレルギー確認シートと照合
・食事中は目を離さない

✅ 救急備品
・救急箱の場所: 職員室棚上段
・AEDの場所: 玄関横

※何か気になることがあればすぐに主任に報告してください`,

    training: `${themeHeader}【安全管理研修資料】${themeNote}

1. 午睡中の安全管理
乳幼児突然死症候群(SIDS)の予防として、午睡中は5分ごとに呼吸確認を行います...

2. 誤嚥・窒息対応
ハイムリック法と背部叩打法の手順を確認します...

3. AED・心肺蘇生
万が一の際には躊躇なくAEDを使用してください...`,

    newcomer: `${themeHeader}【新入職員 安全管理ガイド】${themeNote}

この園で大切にしていること
「子どもの安全を最優先に」

1. まず覚えること
・救急箱とAEDの場所
・緊急連絡先一覧の場所
・避難経路

2. 毎日の確認
・出勤したら安全確認チェックシートを見る
・気になることは即報告する...`,
  }

  return base[type]
}

export const StaffMaterial: React.FC = () => {
  const [selected, setSelected] = useState<MaterialType>('morning')
  const [theme, setTheme] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')

  const placeholder = useRef(
    THEME_PLACEHOLDERS[Math.floor(Math.random() * THEME_PLACEHOLDERS.length)]
  ).current

  const doGenerate = async () => {
    setIsGenerating(true)
    await new Promise((r) => setTimeout(r, 1800))
    setIsGenerating(false)
    const content = buildDemoContent(selected, theme.trim())
    setGenerated(content)
    setEditedContent(content)
  }

  const handleGenerate = async () => {
    await doGenerate()
    toast.success('資料を作成しました')
  }

  const handleRegenerate = async () => {
    await doGenerate()
    toast.success('作り直しました')
  }

  const handleSelectType = (key: MaterialType) => {
    setSelected(key)
    setGenerated(null)
    setEditedContent('')
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="職員向け資料を作る"
        subtitle="AIが下書きを生成します。内容を確認してから使ってください"
      />

      {/* 種別選択 */}
      <div className="space-y-2">
        {MATERIAL_TYPES.map((m) => (
          <Card
            key={m.key}
            className={`p-4 cursor-pointer border-2 transition-colors ${
              selected === m.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleSelectType(m.key)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                  selected === m.key ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                }`}
              />
              <div className="flex items-center gap-2">
                {m.icon}
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-500 break-anywhere">{m.description}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* テーマ自由入力欄 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor="theme-input" className="text-sm font-semibold text-gray-700">
            テーマを入力する
          </label>
          <span className="text-xs text-gray-400">（任意）</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          テーマを入れると、その内容に合わせた資料を作ります。空白のままでも生成できます。
        </p>
        <input
          id="theme-input"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white
                     focus:ring-2 focus:ring-blue-500 focus:outline-none
                     min-h-[48px] break-anywhere"
        />
        {/* 入力例チップ */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {THEME_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setTheme(ex)}
              className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded-full
                         text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                         transition-colors min-h-[28px]"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* 生成ボタン */}
      <Button
        variant="ai"
        fullWidth
        size="lg"
        loading={isGenerating}
        onClick={handleGenerate}
      >
        <Sparkles size={18} />
        {theme.trim() ? 'このテーマで資料を作る' : 'AIでたたき台を作る'}
      </Button>

      {/* 生成結果（編集可能） */}
      {generated !== null && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Pencil size={14} className="text-gray-400 shrink-0" />
              <p className="text-sm font-bold text-gray-900">
                作成された資料
              </p>
              <span className="text-xs text-gray-400 hidden sm:inline">
                （自由に編集できます）
              </span>
            </div>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shrink-0">
              AI生成
            </span>
          </div>

          {/* テーマ表示 */}
          {theme.trim() && (
            <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100
                          rounded-lg px-3 py-2 mb-3 break-anywhere">
              テーマ：{theme.trim()}
            </p>
          )}

          {/* 編集エリア */}
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm
                       resize-y min-h-[200px] leading-relaxed break-anywhere
                       focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            ※ 内容を自由に書き直せます
          </p>

          {/* アクション */}
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => toast.success('PDF出力（デモ）')}
              >
                <FileDown size={14} /> PDFで出力
              </Button>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => toast.success('研修記録を登録しました（デモ）')}
              >
                研修記録を登録
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              loading={isGenerating}
              onClick={handleRegenerate}
            >
              <RotateCcw size={14} />
              もう一度作り直す
            </Button>
          </div>
        </Card>
      )}

      <div className="h-4" />
    </div>
  )
}

export default StaffMaterial
