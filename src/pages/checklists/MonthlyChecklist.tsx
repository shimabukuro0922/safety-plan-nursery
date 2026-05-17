import React, { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText, FileDown, Check, Settings, Plus, Pencil, Trash2, RotateCcw, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button, Card, ProgressBar, Modal } from '@/components/ui'
import { useChecklistStore, useChecklistItemsStore } from '@/stores/appStore'
import type { ChecklistItemDef } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import { exportToPDF } from '@/lib/exportPDF'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

// ==============================
// 項目管理モーダル
// ==============================
const ItemManageModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { items, addItem, updateItem, deleteItem, resetToDefault } = useChecklistItemsStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const startEdit = (item: ChecklistItemDef) => {
    setEditingId(item.id)
    setEditCategory(item.categoryName)
    setEditTitle(item.title)
    setEditDescription(item.description)
  }

  const saveEdit = () => {
    if (!editTitle.trim() || !editCategory.trim()) {
      toast.error('カテゴリと項目名は必須です')
      return
    }
    updateItem(editingId!, { categoryName: editCategory.trim(), title: editTitle.trim(), description: editDescription.trim() })
    setEditingId(null)
    toast.success('更新しました')
  }

  const handleAdd = () => {
    if (!newTitle.trim() || !newCategory.trim()) {
      toast.error('カテゴリと項目名は必須です')
      return
    }
    addItem({ categoryName: newCategory.trim(), title: newTitle.trim(), description: newDescription.trim() })
    setNewCategory('')
    setNewTitle('')
    setNewDescription('')
    toast.success('項目を追加しました')
  }

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`「${title}」を削除しますか？`)) {
      deleteItem(id)
      toast.success('削除しました')
    }
  }

  const handleReset = () => {
    if (window.confirm('サンプル項目（10項目）を読み込みますか？現在の項目はすべて置き換えられます。')) {
      resetToDefault()
      setEditingId(null)
      toast.success('サンプル項目を読み込みました')
    }
  }

  return (
    <Modal open={open} onClose={() => { setEditingId(null); onClose() }} title="チェック項目を管理">
      <div className="space-y-4">
        {/* 既存項目一覧 */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">項目がありません</p>
          )}
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="border border-blue-300 rounded-xl p-3 space-y-2 bg-blue-50">
                <input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="カテゴリ名（例：午睡）"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="項目名（必須）"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="説明・備考（任意）"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" fullWidth onClick={saveEdit}>保存する</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>キャンセル</Button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{item.categoryName}</span>
                  <p className="text-sm text-gray-800 mt-1.5 break-anywhere font-medium">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-500 mt-0.5 break-anywhere">{item.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0 mt-0.5">
                  <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id, item.title)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* 新規追加フォーム */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-700">新しい項目を追加</p>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="カテゴリ名（例：午睡、AED・救急）"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="項目名（必須）"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="説明・備考（任意）"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="primary" fullWidth onClick={handleAdd}>
            <Plus size={14} /> 追加する
          </Button>
        </div>

        {/* リセット */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
        >
          <RotateCcw size={12} />
          サンプル項目を読み込む（10項目）
        </button>
      </div>
    </Modal>
  )
}

// ==============================
// チェックカード（モバイル）
// ==============================
const ChecklistCard: React.FC<{
  itemId: string
  categoryName: string
  title: string
  description: string
  isDone: boolean
  doneAt: string | null
  doneBy: string | null
  doneNotes: string | null
  onDone: (id: string, notes: string) => void
  onUndone: (id: string) => void
}> = ({ itemId, categoryName, title, description, isDone, doneAt, doneBy, doneNotes, onDone, onUndone }) => {
  const [notes, setNotes] = useState('')
  return (
    <Card className={`p-4 ${isDone ? 'opacity-70' : ''}`}>
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
        {categoryName}
      </span>
      <p className={`mt-2 text-sm font-medium break-anywhere leading-relaxed ${isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
        {title}
      </p>
      {description && (
        <p className="mt-1 text-xs text-gray-500 break-anywhere leading-relaxed">{description}</p>
      )}
      {!isDone ? (
        <>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="実施内容・気づいた点を記録（任意）"
            rows={2}
            className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
          />
          <button
            onClick={() => onDone(itemId, notes)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl min-h-[44px] active:bg-green-700 transition-colors"
          >
            <Check size={16} />
            実施済みにする
          </button>
        </>
      ) : (
        <>
          {doneNotes && (
            <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 break-anywhere leading-relaxed">
              📝 {doneNotes}
            </p>
          )}
          <p className="mt-2 text-xs text-green-600">
            ✓ {doneAt ? format(new Date(doneAt), 'M月d日 HH:mm', { locale: ja }) : ''}
            {doneBy ? ` · ${doneBy}` : ''}
          </p>
          <button onClick={() => onUndone(itemId)} className="mt-1 text-xs text-gray-400 underline">
            取り消す
          </button>
        </>
      )}
    </Card>
  )
}

// ==============================
// テーブル行（PC）
// ==============================
const TableRow: React.FC<{
  item: ChecklistItemDef
  done: { done_at: string; done_by: string; notes?: string } | undefined
  onDone: (id: string, notes: string) => void
  onUndone: (id: string) => void
}> = ({ item, done, onDone, onUndone }) => {
  const [notes, setNotes] = useState('')
  return (
    <tr className={done ? 'bg-gray-50' : 'hover:bg-blue-50/30'}>
      <td className="px-4 py-3">
        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
          {item.categoryName}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className={`text-sm break-anywhere ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</p>
        {item.description && <p className="text-xs text-gray-400 mt-0.5 break-anywhere">{item.description}</p>}
      </td>
      <td className="px-4 py-3">
        {!done ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="実施内容・気づきを記録（任意）"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-w-[160px]"
          />
        ) : (
          <p className="text-xs text-gray-600 break-anywhere">
            {done.notes ? `📝 ${done.notes}` : <span className="text-gray-300">—</span>}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {done ? '実施済み' : '未実施'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {done?.done_at ? format(new Date(done.done_at), 'M/d HH:mm', { locale: ja }) : '-'}
        {done?.done_by && <p className="text-gray-400">{done.done_by}</p>}
      </td>
      <td className="px-4 py-3">
        {!done ? (
          <button
            onClick={() => onDone(item.id, notes)}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors min-h-[32px] whitespace-nowrap"
          >
            実施済みにする
          </button>
        ) : (
          <button onClick={() => onUndone(item.id)} className="text-xs text-gray-400 underline">取り消す</button>
        )}
      </td>
    </tr>
  )
}

// ==============================
// メインページ
// ==============================
export const MonthlyChecklist: React.FC = () => {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [manageOpen, setManageOpen] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const checklistRef = useRef<HTMLDivElement>(null)
  const { doneItems, markDone, markUndone, lastMarkedMonth, resetForNewMonth } = useChecklistStore()
  const { items: checklistItems, resetToDefault } = useChecklistItemsStore()
  const { facility } = useFacilityStore()

  // 現在表示中の月キー（YYYY-MM）
  const currentMonthKey = `${year}-${String(month).padStart(2, '0')}`
  // 今月かどうか
  const isCurrentMonth = currentMonthKey === now.toISOString().slice(0, 7)
  // 先月以前のデータが残っていて、今月を表示している場合 → リセットバナーを表示
  const showResetBanner =
    isCurrentMonth &&
    lastMarkedMonth !== null &&
    lastMarkedMonth !== currentMonthKey &&
    Object.keys(doneItems).length > 0

  const adjustMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    // 現在年 ±10 年に制限（誤操作で極端な年に飛ぶのを防ぐ）
    const currentYear = new Date().getFullYear()
    if (y < currentYear - 10 || y > currentYear + 10) return
    setMonth(m); setYear(y)
  }

  const handleDone = (id: string, notes?: string) => {
    markDone(id, facility?.director_name ?? '操作者', notes || undefined)
    toast.success('実施済みとして記録しました')
  }

  const handleUndone = (id: string) => {
    markUndone(id)
    toast('取り消しました')
  }

  const grouped = useMemo(() => {
    const map: Record<string, typeof checklistItems> = {}
    checklistItems.forEach((item) => {
      if (!map[item.categoryName]) map[item.categoryName] = []
      map[item.categoryName].push(item)
    })
    return map
  }, [checklistItems])

  // 過去月・未来月を表示中は実施済みデータを空にして誤表示を防ぐ
  const effectiveDoneItems = isCurrentMonth ? doneItems : {}

  const doneCount = checklistItems.filter((item) => item.id in effectiveDoneItems).length
  const totalCount = checklistItems.length
  const pendingCount = totalCount - doneCount

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => adjustMonth(-1)}
          className="p-2 rounded-xl border border-gray-200 bg-white min-w-[44px] min-h-[44px] flex items-center justify-center active:bg-gray-50"
          aria-label="前月"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 text-center">{year}年{month}月　月次チェック表</h2>
        <button
          onClick={() => adjustMonth(+1)}
          className="p-2 rounded-xl border border-gray-200 bg-white min-w-[44px] min-h-[44px] flex items-center justify-center active:bg-gray-50"
          aria-label="翌月"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* PDFダウンロードボタン */}
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        loading={exportingPDF}
        onClick={async () => {
          if (!checklistRef.current) return
          setExportingPDF(true)
          try {
            await exportToPDF(checklistRef.current, {
              filename: `${year}年${month}月_月次チェック表`,
            })
            toast.success('PDFを保存しました')
          } catch {
            toast.error('PDF生成に失敗しました')
          } finally {
            setExportingPDF(false)
          }
        }}
      >
        <FileDown size={14} />
        このチェック表をPDFで保存
      </Button>

      {/* チェック表本文（PDF出力対象） */}
      <div ref={checklistRef}>
      {/* 月またぎリセットバナー */}
      {showResetBanner && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">先月の記録が残っています</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lastMarkedMonth?.replace(/^(\d{4})-0?(\d+)$/, '$1年$2')}月の実施済み記録がそのまま表示されています。今月の新しい記録を始めましょう。
            </p>
            <button
              onClick={() => {
                if (window.confirm('先月の実施記録をすべてクリアして、今月を新しく始めますか？')) {
                  resetForNewMonth()
                  toast.success('今月の記録を開始しました')
                }
              }}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <RefreshCw size={12} />
              今月の記録を新しく始める
            </button>
          </div>
        </div>
      )}

      {/* 項目管理ボタン */}
      <button
        onClick={() => setManageOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors min-h-[44px]"
      >
        <Settings size={14} />
        チェック項目を追加・編集する
      </button>

      {totalCount === 0 ? (
        <Card className="p-6 text-center space-y-4">
          <div>
            <Settings size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-600 font-semibold">チェック項目がまだありません</p>
            <p className="text-xs text-gray-400 mt-1">サンプルを読み込むか、独自の項目を追加してください</p>
          </div>
          <Button variant="primary" fullWidth onClick={() => { resetToDefault(); toast.success('サンプル項目（10項目）を読み込みました') }}>
            <RotateCcw size={14} />
            サンプル項目（10項目）を読み込む
          </Button>
          <button
            onClick={() => setManageOpen(true)}
            className="w-full py-2.5 border border-dashed border-blue-300 rounded-xl text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            <Plus size={14} className="inline mr-1" />
            自分で項目を追加する
          </button>
        </Card>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <ProgressBar done={doneCount} total={totalCount} />
          </div>

          {pendingCount === 0 && totalCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Check size={18} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">今月のチェックが完了しています</p>
            </div>
          )}

          {/* 過去月・未来月を表示中は注記を表示 */}
          {!isCurrentMonth && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                過去・未来の月を表示中です。実施記録は今月分のみ保存されます。
              </p>
            </div>
          )}

          {/* モバイル: カード形式 */}
          <div className="md:hidden space-y-5">
            {Object.entries(grouped).map(([catName, catItems]) => (
              <div key={catName}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{catName}</p>
                <div className="space-y-2">
                  {catItems.map((item) => {
                    const done = effectiveDoneItems[item.id]
                    return (
                      <ChecklistCard
                        key={item.id}
                        itemId={item.id}
                        categoryName={item.categoryName}
                        title={item.title}
                        description={item.description}
                        isDone={!!done}
                        doneAt={done?.done_at ?? null}
                        doneBy={done?.done_by ?? null}
                        doneNotes={done?.notes ?? null}
                        onDone={handleDone}
                        onUndone={handleUndone}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* PC: テーブル形式 */}
          <div className="hidden md:block">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-28">カテゴリ</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">チェック項目</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">実施内容・記録</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-24">状態</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-32">実施日時</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-36">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {checklistItems.map((item) => {
                    const done = effectiveDoneItems[item.id]
                    return (
                      <TableRow
                        key={item.id}
                        item={item}
                        done={done}
                        onDone={handleDone}
                        onUndone={handleUndone}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      </div>{/* checklistRef end */}

      <div className="pt-2 space-y-2">
        <Button variant="secondary" fullWidth onClick={() => navigate('/reports/new')}>
          <FileText size={16} />
          この結果から報告書を作成する
        </Button>
      </div>

      <ItemManageModal open={manageOpen} onClose={() => setManageOpen(false)} />

      <div className="h-4" />
    </div>
  )
}

export default MonthlyChecklist
