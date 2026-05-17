import React, { useState, useEffect } from 'react'
import { Sun, Wind, Snowflake, Flower2, CheckCircle2, Circle, Plus, Pencil, Trash2, X, Check, RotateCcw } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { useSeasonalChecklistStore, useSeasonalItemsStore } from '@/stores/appStore'
import type { SeasonalItemDef } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import toast from 'react-hot-toast'

interface SeasonMeta {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  headerBg: string
}

const SEASON_META: SeasonMeta[] = [
  { key: 'spring', label: '春季（3〜4月）', icon: <Flower2 size={20} className="text-pink-500" />,   color: 'bg-pink-50 border-pink-200',   headerBg: 'bg-pink-50' },
  { key: 'summer', label: '夏季（6〜7月）', icon: <Sun size={20} className="text-yellow-500" />,      color: 'bg-yellow-50 border-yellow-200', headerBg: 'bg-yellow-50' },
  { key: 'autumn', label: '秋季（9〜10月）', icon: <Wind size={20} className="text-orange-500" />,    color: 'bg-orange-50 border-orange-200', headerBg: 'bg-orange-50' },
  { key: 'winter', label: '冬季（12〜1月）', icon: <Snowflake size={20} className="text-blue-500" />, color: 'bg-blue-50 border-blue-200',     headerBg: 'bg-blue-50' },
]

// ==============================
// シーズンカード
// ==============================
const SeasonCard: React.FC<{
  meta: SeasonMeta
  items: SeasonalItemDef[]
  staffName: string
  doneItems: Record<string, { done_at: string; done_by: string }>
  onToggle: (key: string, label: string) => void
  onAddItem: (seasonKey: string, label: string) => void
  onUpdateItem: (key: string, label: string) => void
  onDeleteItem: (key: string) => void
}> = ({ meta, items, staffName, doneItems, onToggle, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [editMode, setEditMode] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [newLabel, setNewLabel] = useState('')

  const doneCount = items.filter((item) => item.key in doneItems).length

  const startEdit = (item: SeasonalItemDef) => {
    setEditingKey(item.key)
    setEditLabel(item.label)
  }

  const saveEdit = () => {
    if (!editLabel.trim()) return
    onUpdateItem(editingKey!, editLabel.trim())
    setEditingKey(null)
    toast.success('更新しました')
  }

  const handleAdd = () => {
    if (!newLabel.trim()) return
    onAddItem(meta.key, newLabel.trim())
    setNewLabel('')
    toast.success('項目を追加しました')
  }

  return (
    <Card className={`overflow-hidden border-2 ${meta.color}`}>
      {/* シーズンヘッダー */}
      <div className={`flex items-center justify-between px-4 py-3 ${meta.headerBg}`}>
        <div className="flex items-center gap-3">
          {meta.icon}
          <p className="text-sm font-bold text-gray-900">{meta.label}</p>
          <span className="text-xs text-gray-500">{doneCount}/{items.length}</span>
        </div>
        <button
          onClick={() => { setEditMode((v) => !v); setEditingKey(null) }}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px] ${
            editMode ? 'bg-gray-200 text-gray-700' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          {editMode ? <><X size={13} /> 編集を終わる</> : <><Pencil size={13} /> 編集</>}
        </button>
      </div>

      {/* 項目一覧 */}
      <div className="p-4 space-y-2">
        {items.length === 0 && !editMode && (
          <p className="text-xs text-gray-400 text-center py-2">
            「編集」ボタンから項目を追加してください
          </p>
        )}

        {editMode ? (
          /* ===== 編集モード ===== */
          <>
            {items.map((item) =>
              editingKey === item.key ? (
                <div key={item.key} className="flex items-center gap-2">
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    autoFocus
                    className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] bg-white"
                  />
                  <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingKey(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div key={item.key} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                  <span className="flex-1 text-sm text-gray-700 break-anywhere">{item.label}</span>
                  <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`「${item.label}」を削除しますか？`)) {
                        if (editingKey === item.key) setEditingKey(null)
                        onDeleteItem(item.key)
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            )}

            {/* 新規追加 */}
            <div className="flex gap-2 mt-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="新しい項目を追加（Enter でも追加）"
                className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] bg-white"
              />
              <button
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
          </>
        ) : (
          /* ===== 通常モード（チェックボックス） ===== */
          items.map((item) => {
            const done = item.key in doneItems
            const record = doneItems[item.key]
            return (
              <button
                key={item.key}
                onClick={() => onToggle(item.key, item.label)}
                className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors min-h-[44px]
                  ${done ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
              >
                {done
                  ? <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  : <Circle size={18} className="text-gray-300 shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium break-anywhere ${done ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {done && record && (
                    <p className="text-xs text-green-600 mt-0.5">
                      {record.done_by}　{new Date(record.done_at).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </Card>
  )
}

// ==============================
// メインページ
// ==============================
export const SeasonalChecklist: React.FC = () => {
  const { doneItems, markDone, markUndone, isDone } = useSeasonalChecklistStore()
  const { items, addItem, updateItem, deleteItem, resetToDefault } = useSeasonalItemsStore()
  const { facility } = useFacilityStore()
  const [staffName, setStaffName] = useState(facility?.director_name ?? '')

  // 設定画面で施設長名が変更されたとき担当者名に反映する
  useEffect(() => {
    if (facility?.director_name) setStaffName(facility.director_name)
  }, [facility?.director_name])

  const handleToggle = (itemKey: string, itemLabel: string) => {
    if (isDone(itemKey)) {
      markUndone(itemKey)
      toast.success(`「${itemLabel}」を未実施に戻しました`)
    } else {
      const name = staffName.trim() || '未記入'
      markDone(itemKey, name)
      toast.success(`「${itemLabel}」を完了しました`)
    }
  }

  const handleResetAll = () => {
    if (window.confirm('サンプル項目を読み込みますか？現在の設定はすべて置き換えられます。')) {
      resetToDefault()
      toast.success('サンプル項目を読み込みました')
    }
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="季節前チェック表"
        subtitle="季節ごとの安全確認項目を記録します。各シーズンの「編集」から項目のカスタマイズができます"
      />

      {/* 実施者入力 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <label className="text-xs font-semibold text-gray-600 block mb-2">実施者名</label>
        <input
          type="text"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          placeholder="例：山田 花子"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">チェック時に実施者名として記録されます</p>
      </div>

      {SEASON_META.map((meta) => (
        <SeasonCard
          key={meta.key}
          meta={meta}
          items={items.filter((i) => i.seasonKey === meta.key)}
          staffName={staffName}
          doneItems={doneItems}
          onToggle={handleToggle}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onDeleteItem={(key) => { deleteItem(key); toast.success('削除しました') }}
        />
      ))}

      <button
        onClick={handleResetAll}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
      >
        <RotateCcw size={12} />
        サンプル項目を読み込む
      </button>

      <div className="h-4" />
    </div>
  )
}

export default SeasonalChecklist
