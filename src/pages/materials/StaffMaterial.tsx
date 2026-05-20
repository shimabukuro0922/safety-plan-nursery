import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FileDown, Users, BookOpen, UserPlus, RotateCcw, Pencil, Plus, Trash2, X, Check, Settings } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useStaffMaterialTypeStore } from '@/stores/appStore'
import type { StaffMaterialTypeDef } from '@/stores/appStore'
import { exportToPDF } from '@/lib/exportPDF'
import toast from 'react-hot-toast'

const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  morning:  <BookOpen size={18} className="text-emerald-500" />,
  training: <Users size={18} className="text-green-500" />,
  newcomer: <UserPlus size={18} className="text-purple-500" />,
}

const THEME_EXAMPLES = ['午睡時の見守り', '誤嚥の初動対応', 'AEDの使い方', '新年度の安全確認']
const THEME_PLACEHOLDERS = [
  '例：午睡時の呼吸確認',
  '例：誤嚥時の初動対応',
  '例：AEDの使い方を新人向けに',
  '例：新年度の安全確認ポイント',
]

const buildContent = (typeKey: string, typeLabel: string, theme: string): string => {
  const themeHeader = theme ? `▼ ${theme} についての資料\n\n` : ''
  const themeNote = theme ? `\n【テーマ：${theme}】` : ''

  const builtIn: Record<string, string> = {
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

  if (builtIn[typeKey]) return builtIn[typeKey]

  return `${themeHeader}【${typeLabel}】${themeNote}

この資料は「${typeLabel}」用のたたき台です。
園の実情に合わせて自由に編集してください。

${theme ? `テーマ：${theme}\n\n` : ''}■ ポイント1
（内容を入力してください）

■ ポイント2
（内容を入力してください）

■ まとめ
（内容を入力してください）`
}

// ==============================
// 種別管理モーダル
// ==============================
const TypeManageModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { types, addType, updateType, deleteType, resetToDefault } = useStaffMaterialTypeStore()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDesc, setNewDesc] = useState('')

  if (!open) return null

  const startEdit = (t: StaffMaterialTypeDef) => { setEditingKey(t.key); setEditLabel(t.label); setEditDesc(t.description) }
  const saveEdit = () => {
    if (!editLabel.trim()) return
    updateType(editingKey!, editLabel.trim(), editDesc.trim())
    setEditingKey(null)
    toast.success('更新しました')
  }
  const handleAdd = () => {
    if (!newLabel.trim()) return
    addType(newLabel.trim(), newDesc.trim())
    setNewLabel(''); setNewDesc('')
    toast.success('種別を追加しました')
  }
  const handleDelete = (key: string, label: string) => {
    if (window.confirm(`「${label}」を削除しますか？`)) { deleteType(key); toast.success('削除しました') }
  }
  const handleReset = () => {
    if (window.confirm('種別をデフォルトに戻しますか？カスタム追加分は削除されます。')) {
      resetToDefault(); toast.success('デフォルトに戻しました')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">資料の種別を管理</p>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {types.map((t) =>
            editingKey === t.key ? (
              <div key={t.key} className="border border-emerald-200 rounded-xl p-3 space-y-2 bg-emerald-50">
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="種別名" autoFocus
                  className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] bg-white" />
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="説明文（任意）"
                  className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] bg-white" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-2 rounded-lg min-h-[36px]"><Check size={13} /> 保存</button>
                  <button onClick={() => setEditingKey(null)} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg min-h-[36px]"><X size={13} /> キャンセル</button>
                </div>
              </div>
            ) : (
              <div key={t.key} className="flex items-start gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 break-anywhere">{t.label}</p>
                  {t.description && <p className="text-xs text-gray-500 break-anywhere mt-0.5">{t.description}</p>}
                </div>
                <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-emerald-600 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center">
                  <Pencil size={13} />
                </button>
                {!t.isDefault && (
                  <button onClick={() => handleDelete(t.key, t.label)} className="p-1.5 text-gray-400 hover:text-red-500 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          )}

          {/* 新規追加 */}
          <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2 mt-2">
            <p className="text-xs font-semibold text-gray-500">新しい種別を追加</p>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="種別名（例：保護者向け説明用）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="説明文（任意）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]" />
            <button onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-4 py-2 rounded-lg min-h-[36px] hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus size={14} /> 追加する
            </button>
          </div>

          <button onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 mt-1">
            <RotateCcw size={11} /> デフォルトに戻す
          </button>
        </div>
      </div>
    </div>
  )
}

// ==============================
// メインページ
// ==============================
export const StaffMaterial: React.FC = () => {
  const navigate = useNavigate()
  const { types } = useStaffMaterialTypeStore()
  const [selected, setSelected] = useState<string>(types[0]?.key ?? 'morning')
  const [theme, setTheme] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [exportingPDF, setExportingPDF] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // ランダムプレースホルダーは初回マウント時のみ決定（lazy initializer で実行）
  const [placeholder] = useState(
    () => THEME_PLACEHOLDERS[Math.floor(Math.random() * THEME_PLACEHOLDERS.length)]
  )

  const selectedType = types.find((t) => t.key === selected) ?? types[0]

  // 現在選択中の種別が削除されたとき、最初の種別にリセット
  React.useEffect(() => {
    if (types.length > 0 && !types.find((t) => t.key === selected)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelected(types[0].key)
      setGenerated(null)
      setEditedContent('')
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [types, selected])

  const doGenerate = async (): Promise<boolean> => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeKey: selected,
          typeLabel: selectedType?.label ?? '',
          theme: theme.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '生成に失敗しました')
      setGenerated(data.text)
      setEditedContent(data.text)
      return true
    } catch {
      // API失敗時はローカルのテンプレートをフォールバックとして使用
      const text = buildContent(selected, selectedType?.label ?? '', theme.trim())
      setGenerated(text)
      setEditedContent(text)
      toast('AI生成に失敗したため、標準テンプレートを表示しています。内容を確認して編集してください', { icon: 'ℹ️' })
      return true
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => { if (await doGenerate()) toast.success('資料を作成しました') }
  const handleRegenerate = async () => { if (await doGenerate()) toast.success('作り直しました') }

  const handleSelectType = (key: string) => {
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
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600">資料の種別</p>
          <button
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-gray-400 transition-colors min-h-[32px]"
          >
            <Settings size={12} /> 種別を編集
          </button>
        </div>
        <div className="space-y-2">
          {types.map((t) => (
            <Card
              key={t.key}
              className={`p-4 cursor-pointer border-2 transition-colors ${
                selected === t.key ? 'border-blue-500 bg-emerald-50' : 'border-gray-200'
              }`}
              onClick={() => handleSelectType(t.key)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${selected === t.key ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`} />
                <div className="flex items-center gap-2">
                  {DEFAULT_ICONS[t.key] ?? <BookOpen size={18} className="text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.label}</p>
                    {t.description && <p className="text-xs text-gray-500 break-anywhere">{t.description}</p>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* テーマ自由入力欄 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor="theme-input" className="text-sm font-semibold text-gray-700">テーマを入力する</label>
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
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[48px] break-anywhere"
        />
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {THEME_EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setTheme(ex)}
              className="text-xs px-2.5 py-1 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors min-h-[28px]">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* 生成ボタン */}
      <Button variant="ai" fullWidth size="lg" loading={isGenerating} onClick={handleGenerate}>
        <Sparkles size={18} />
        {theme.trim() ? 'このテーマで資料を作る' : 'AIでたたき台を作る'}
      </Button>

      {/* 生成結果（編集可能） */}
      {generated !== null && (
        <>
          {/* PDF出力対象エリア（ボタン類を除いた本文のみ） */}
          <div ref={contentRef}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Pencil size={14} className="text-gray-400 shrink-0" />
                  <p className="text-sm font-bold text-gray-900">作成された資料</p>
                  <span className="text-xs text-gray-400 hidden sm:inline">（自由に編集できます）</span>
                </div>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full shrink-0">AI生成</span>
              </div>
              {theme.trim() && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3 break-anywhere">
                  テーマ：{theme.trim()}
                </p>
              )}
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm resize-y min-h-[200px] leading-relaxed break-anywhere focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">※ 内容を自由に書き直せます</p>
            </Card>
          </div>
          {/* ボタン類はPDF対象外 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="secondary" size="sm" fullWidth
                loading={exportingPDF}
                onClick={async () => {
                  if (!contentRef.current) return
                  setExportingPDF(true)
                  try {
                    await exportToPDF(contentRef.current, {
                      filename: `職員資料_${selectedType?.label ?? ''}`,
                    })
                    toast.success('PDFを保存しました')
                  } catch {
                    toast.error('PDF生成に失敗しました')
                  } finally {
                    setExportingPDF(false)
                  }
                }}
              >
                <FileDown size={14} /> PDFで出力
              </Button>
              <Button variant="secondary" size="sm" fullWidth onClick={() => { navigate('/training'); toast('研修実績は「職員研修・資格管理」から記録できます', { icon: 'ℹ️' }) }}>
                研修記録を登録
              </Button>
            </div>
            <Button variant="ghost" size="sm" fullWidth loading={isGenerating} onClick={handleRegenerate}>
              <RotateCcw size={14} /> もう一度作り直す
            </Button>
          </div>
        </>
      )}

      <div className="h-4" />

      <TypeManageModal open={manageOpen} onClose={() => setManageOpen(false)} />
    </div>
  )
}

export default StaffMaterial
