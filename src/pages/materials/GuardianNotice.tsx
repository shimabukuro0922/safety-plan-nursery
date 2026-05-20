import React, { useState } from 'react'
import { Sparkles, FileDown, Send, Pencil, Plus, Trash2, X, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { useNoticeCategoryStore } from '@/stores/appStore'
import { exportToPDF } from '@/lib/exportPDF'
import toast from 'react-hot-toast'

const STYLES = [
  { value: 'gentle',   label: 'やわらかい文体',  sub: '保護者に親しみやすく' },
  { value: 'standard', label: '標準文体',         sub: '一般的なおたより形式' },
  { value: 'formal',   label: '丁寧な文体',       sub: '正式な通知として' },
]

export const GuardianNotice: React.FC = () => {
  const { facility } = useFacilityStore()
  const { categories, addCategory, updateCategory, deleteCategory, resetToDefault } = useNoticeCategoryStore()

  const [selectedCats, setSelectedCats] = useState<string[]>([])
  // カテゴリごとのテーマ・補足メモ
  const [catThemes, setCatThemes] = useState<Record<string, string>>({})
  const [style, setStyle] = useState('gentle')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [exportingPDF, setExportingPDF] = useState(false)

  // 編集モード
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')

  // テーマ欄の開閉
  const [themeOpen, setThemeOpen] = useState(false)

  // AI外部送信への同意チェック
  const [aiConsented, setAiConsented] = useState(false)
  // テンプレートフォールバック中フラグ
  const [isTemplate, setIsTemplate] = useState(false)

  const toggleCat = (id: string) => {
    if (editMode) return
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const buildLocalTemplate = (catNames: string[]): string => {
    const facilityName = facility?.name ?? '当園'
    return `保護者の皆様へ\n\n${facilityName}より、安全管理に関するお知らせです。\n\n今月は以下の取り組みを実施しております。\n\n${catNames.map((c) => `■ ${c}\n  園では、${c}に関する取り組みを積極的に行っております。ご家庭でも引き続きご協力をお願いいたします。`).join('\n\n')}\n\n子どもたちの安全を最優先に、職員一同取り組んでまいります。\nご不明な点やご心配なことがございましたら、いつでもお声がけください。\n\n${new Date().getFullYear()}年${new Date().getMonth() + 1}月\n${facilityName}`
  }

  const handleGenerate = async () => {
    if (selectedCats.length === 0) { toast.error('カテゴリを1つ以上選択してください'); return }
    setIsGenerating(true)
    const catNames = categories.filter((c) => selectedCats.includes(c.id)).map((c) => c.name)
    // 選択カテゴリとテーマを組み合わせ
    const catWithThemes = categories
      .filter((c) => selectedCats.includes(c.id))
      .map((c) => ({
        name: c.name,
        theme: catThemes[c.id]?.trim() ?? '',
      }))
    try {
      const res = await fetch('/api/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: catWithThemes,
          style,
          facilityName: facility?.name ?? '当園',
        }),
      })
      let data: { text?: string; error?: string }
      try {
        data = await res.json()
      } catch {
        throw new Error('サーバーからの応答を解析できませんでした')
      }
      if (!res.ok) throw new Error(data.error ?? '生成に失敗しました')
      setGenerated(data.text ?? '')
      setEditedContent(data.text ?? '')
      setIsTemplate(false)
      toast.success('保護者周知文を作成しました')
    } catch {
      // API失敗時はローカルテンプレートを使用
      const text = buildLocalTemplate(catNames)
      setGenerated(text)
      setEditedContent(text)
      setIsTemplate(true)
      toast('AI生成に失敗しました。テンプレートを表示しています', { icon: '⚠️' })
    } finally {
      setIsGenerating(false)
    }
  }

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditName(name) }
  const saveEdit = () => {
    if (!editName.trim()) return
    updateCategory(editingId!, editName.trim())
    setEditingId(null)
    toast.success('更新しました')
  }
  const handleAdd = () => {
    if (!newName.trim()) return
    addCategory(newName.trim())
    setNewName('')
    toast.success('カテゴリを追加しました')
  }
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`「${name}」を削除しますか？`)) {
      deleteCategory(id)
      setSelectedCats((prev) => prev.filter((c) => c !== id))
      toast.success('削除しました')
    }
  }
  const handleReset = () => {
    if (window.confirm('カテゴリをデフォルトに戻しますか？カスタム追加分は削除されます。')) {
      resetToDefault()
      setSelectedCats([])
      toast.success('デフォルトに戻しました')
    }
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader title="保護者向け周知文を作る" subtitle="下書きを作成します。配布前に必ず内容を確認・編集してください" />

      {/* カテゴリ選択 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600">① 周知したいカテゴリを選ぶ（複数可）</p>
          <button
            onClick={() => { setEditMode((v) => !v); setEditingId(null) }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors min-h-[32px] ${
              editMode ? 'bg-gray-200 text-gray-700' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {editMode ? <><X size={12} /> 完了</> : <><Pencil size={12} /> 編集</>}
          </button>
        </div>

        {editMode ? (
          /* ===== 編集モード ===== */
          <div className="space-y-2">
            {categories.map((cat) =>
              editingId === cat.id ? (
                <div key={cat.id} className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="flex-1 border border-emerald-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] bg-white"
                  />
                  <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center">
                    <Check size={15} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div key={cat.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                  <span className="flex-1 text-sm text-gray-700 break-anywhere">{cat.name}</span>
                  <button onClick={() => startEdit(cat.id, cat.name)} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            )}
            {/* 新規追加 */}
            <div className="flex gap-2 mt-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="新しいカテゴリを追加（例：熱中症対策）"
                className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px] bg-white"
              />
              <button onClick={handleAdd} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
              <RotateCcw size={11} /> デフォルトに戻す
            </button>
          </div>
        ) : (
          /* ===== 通常モード ===== */
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors min-h-[44px] break-anywhere
                  ${selectedCats.includes(cat.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* テーマ・補足メモ入力（カテゴリ選択後に表示） */}
      {selectedCats.length > 0 && !editMode && (
        <Card className="overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center justify-between text-left"
            onClick={() => setThemeOpen((v) => !v)}
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">② 書きたい内容・テーマを入力（任意）</p>
              <p className="text-xs text-gray-400 mt-0.5">入力するとAIがより具体的な文章を作成します</p>
            </div>
            {themeOpen
              ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
              : <ChevronDown size={16} className="text-gray-400 shrink-0" />
            }
          </button>
          {themeOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {categories
                .filter((c) => selectedCats.includes(c.id))
                .map((cat) => (
                  <div key={cat.id}>
                    <label className="text-xs font-medium text-emerald-700 block mb-1">
                      {cat.name} のテーマ・伝えたいこと
                    </label>
                    <textarea
                      value={catThemes[cat.id] ?? ''}
                      onChange={(e) => setCatThemes((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      placeholder={`例：今月はプール開きがあります。水の事故防止のため、ご家庭でも水の危険性について話し合ってください。`}
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-emerald-400 focus:outline-none leading-relaxed"
                    />
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* 文体選択 */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">③ 文体を選ぶ</p>
        <div className="space-y-2">
          {STYLES.map((s) => (
            <Card
              key={s.value}
              className={`p-3 cursor-pointer border-2 ${style === s.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
              onClick={() => setStyle(s.value)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${style === s.value ? 'border-emerald-500 bg-emerald-500' : 'border-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.sub}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI外部送信への同意 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2.5">
        <p className="text-xs text-amber-800 leading-relaxed">
          ⚠️ <strong>AI文書作成に関するご注意</strong><br />
          入力した内容は外部AIサービス（Anthropic Claude）に送信されます。<strong>園児名・職員名・事故の詳細など個人情報は入力しないでください。</strong><br />
          生成された文章はあくまで下書きです。配布・提出前に必ず職員が内容を確認・修正してください。
        </p>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={aiConsented}
            onChange={(e) => setAiConsented(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-amber-600 shrink-0 cursor-pointer"
          />
          <span className="text-xs text-amber-900 font-medium leading-relaxed">
            個人情報を入力しないことを確認し、外部AIサービスへの送信に同意する
          </span>
        </label>
      </div>

      <Button
        variant="ai"
        fullWidth
        size="lg"
        loading={isGenerating}
        disabled={!aiConsented}
        onClick={handleGenerate}
      >
        <Sparkles size={18} /> 文章を自動で作る
      </Button>

      {generated && (
        <>
          {/* テンプレートフォールバック時のバナー */}
          {isTemplate && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-800">AIによる生成ができませんでした</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  ネットワークエラーまたはAPIの一時的な問題が発生したため、定型テンプレートを表示しています。内容を確認・編集してからご利用ください。
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="shrink-0 flex items-center gap-1 text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-2.5 py-1.5 transition-colors font-medium"
              >
                <RotateCcw size={12} /> 再試行
              </button>
            </div>
          )}

          {/* 編集エリア（画面表示用） */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900">生成された周知文（下書き）</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isTemplate ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                {isTemplate ? 'テンプレート' : 'AI生成'}
              </span>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm resize-none min-h-[280px] leading-relaxed break-anywhere focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">※ 上の文章は自由に編集できます。配布前に必ず確認してください。</p>
          </Card>

          {/* ボタン類 */}
          <div className="flex gap-2">
            <Button
              variant="secondary" size="sm" fullWidth
              loading={exportingPDF}
              onClick={async () => {
                setExportingPDF(true)
                // PDF出力専用の一時要素をbodyに追加してキャプチャ
                const printEl = document.createElement('div')
                printEl.setAttribute('data-pdf-temp', '1')
                Object.assign(printEl.style, {
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '740px',
                  padding: '60px 72px',
                  background: '#ffffff',
                  fontFamily: '"Hiragino Kaku Gothic ProN","Meiryo","Noto Sans JP",sans-serif',
                  fontSize: '14px',
                  lineHeight: '2.0',
                  color: '#111111',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  zIndex: '-1',
                  pointerEvents: 'none',
                })
                if (facility?.name) {
                  const hdr = document.createElement('div')
                  Object.assign(hdr.style, { fontSize: '11px', textAlign: 'right', color: '#555', marginBottom: '20px' })
                  hdr.textContent = facility.name
                  printEl.appendChild(hdr)
                }
                const body = document.createElement('div')
                body.textContent = editedContent || generated || ''
                printEl.appendChild(body)
                document.body.appendChild(printEl)
                try {
                  await exportToPDF(printEl, { filename: '保護者向け周知文' })
                  toast.success('PDFを保存しました')
                } catch {
                  toast.error('PDF生成に失敗しました')
                } finally {
                  document.querySelectorAll('[data-pdf-temp]').forEach((el) => el.remove())
                  setExportingPDF(false)
                }
              }}
            >
              <FileDown size={14} /> PDF出力
            </Button>
            <Button variant="secondary" size="sm" fullWidth onClick={() => {
              const a = document.createElement('a')
              const blob = new Blob([editedContent || generated || ''], { type: 'text/plain;charset=utf-8' })
              a.href = URL.createObjectURL(blob)
              a.download = `保護者向けお知らせ_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '-')}.txt`
              a.click()
              URL.revokeObjectURL(a.href)
              toast.success('テキストファイルとして保存しました')
            }}>
              <Send size={14} /> テキストで保存
            </Button>
          </div>
        </>
      )}
      <div className="h-4" />
    </div>
  )
}

export default GuardianNotice
