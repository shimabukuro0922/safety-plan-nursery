import React, { useState } from 'react'
import { Sparkles, FileDown, Send, Pencil, Plus, Trash2, X, Check, RotateCcw } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { useNoticeCategoryStore } from '@/stores/appStore'
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
  const [style, setStyle] = useState('gentle')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')

  // 編集モード
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newName, setNewName] = useState('')

  const toggleCat = (id: string) => {
    if (editMode) return
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const buildLocalTemplate = (catNames: string[], styleName: string): string => {
    const styleLabel = styleName === 'gentle' ? 'やわらかい' : styleName === 'formal' ? '丁寧な' : '標準的な'
    const facilityName = facility?.name ?? '当園'
    return `【保護者の皆様へ】\n\n${facilityName}より、安全管理に関するお知らせです。\n\n今月は以下の取り組みを実施しております。\n\n${catNames.map((c) => `▶ ${c}`).join('\n')}\n\n引き続き子どもたちの安全を第一に取り組んでまいります。\nご不明な点はお気軽にお声がけください。\n\n${facilityName}`
  }

  const handleGenerate = async () => {
    if (selectedCats.length === 0) { toast.error('カテゴリを1つ以上選択してください'); return }
    setIsGenerating(true)
    const catNames = categories.filter((c) => selectedCats.includes(c.id)).map((c) => c.name)
    try {
      const res = await fetch('/api/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: catNames,
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
      toast.success('保護者周知文を作成しました')
    } catch {
      // API失敗時はローカルテンプレートを使用
      const text = buildLocalTemplate(catNames, style)
      setGenerated(text)
      setEditedContent(text)
      toast('オフラインのため標準テンプレートを表示しています。内容を確認・編集してください', { icon: 'ℹ️' })
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
          <p className="text-xs font-semibold text-gray-600">周知したいカテゴリ（複数選択可）</p>
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
                    className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] bg-white"
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
                  <button onClick={() => startEdit(cat.id, cat.name)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
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
                className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] bg-white"
              />
              <button onClick={handleAdd} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center">
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
                  ${selectedCats.includes(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 文体選択 */}
      {!editMode && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">文体</p>
          <div className="space-y-2">
            {STYLES.map((s) => (
              <Card
                key={s.value}
                className={`p-3 cursor-pointer border-2 ${style === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setStyle(s.value)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${style === s.value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.sub}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!editMode && (
        <Button variant="ai" fullWidth size="lg" loading={isGenerating} onClick={handleGenerate}>
          <Sparkles size={18} /> 文章を自動で作る
        </Button>
      )}

      {generated && !editMode && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">生成された周知文（下書き）</p>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">自動生成</span>
          </div>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm resize-none min-h-[240px] leading-relaxed break-anywhere focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">※ 上の文章は自由に編集できます。配布前に必ず確認してください。</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => toast.success('印刷・PDF出力はブラウザの印刷機能をご利用ください')}>
              <FileDown size={14} /> PDF出力
            </Button>
            <Button variant="secondary" size="sm" fullWidth onClick={() => toast('配布後は「実施記録・証跡」ページから記録してください', { icon: 'ℹ️' })}>
              <Send size={14} /> 配布済みとして記録
            </Button>
          </div>
        </Card>
      )}
      <div className="h-4" />
    </div>
  )
}

export default GuardianNotice
