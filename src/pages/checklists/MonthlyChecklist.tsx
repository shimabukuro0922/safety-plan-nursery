import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText, Check } from 'lucide-react'
import { Button, Card, ProgressBar, Modal } from '@/components/ui'
import { useChecklistStore } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import { MONTHLY_CHECKLIST_ITEMS } from '@/lib/checklistItems'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

const ChecklistCard: React.FC<{
  itemId: string
  categoryName: string
  title: string
  description: string
  isDone: boolean
  doneAt: string | null
  doneBy: string | null
  onDone: (id: string) => void
  onUndone: (id: string) => void
}> = ({ itemId, categoryName, title, description, isDone, doneAt, doneBy, onDone, onUndone }) => (
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
    {isDone && doneAt && (
      <p className="mt-2 text-xs text-green-600">
        ✓ {format(new Date(doneAt), 'M月d日 HH:mm', { locale: ja })}
        {doneBy ? ` · ${doneBy}` : ''}
      </p>
    )}
    {!isDone ? (
      <button
        onClick={() => onDone(itemId)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl min-h-[44px] active:bg-green-700 transition-colors"
      >
        <Check size={16} />
        実施済みにする
      </button>
    ) : (
      <button
        onClick={() => onUndone(itemId)}
        className="mt-2 text-xs text-gray-400 underline"
      >
        取り消す
      </button>
    )}
  </Card>
)

export const MonthlyChecklist: React.FC = () => {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { doneItems, markDone, markUndone } = useChecklistStore()
  const { facility } = useFacilityStore()

  const adjustMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  const handleDone = (id: string) => {
    markDone(id, facility?.director_name ?? '操作者')
    toast.success('実施済みとして記録しました')
  }

  const handleUndone = (id: string) => {
    markUndone(id)
    toast('取り消しました')
  }

  const grouped = useMemo(() => {
    const map: Record<string, typeof MONTHLY_CHECKLIST_ITEMS> = {}
    MONTHLY_CHECKLIST_ITEMS.forEach((item) => {
      if (!map[item.categoryName]) map[item.categoryName] = []
      map[item.categoryName].push(item)
    })
    return map
  }, [])

  const doneCount = MONTHLY_CHECKLIST_ITEMS.filter((item) => item.id in doneItems).length
  const totalCount = MONTHLY_CHECKLIST_ITEMS.length
  const pendingCount = totalCount - doneCount

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => adjustMonth(-1)}
          className="p-2 rounded-xl border border-gray-200 bg-white min-w-[44px] min-h-[44px] flex items-center justify-center active:bg-gray-50"
          aria-label="前月">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-900">{year}年{month}月　月次チェック表</h2>
        <button onClick={() => adjustMonth(+1)}
          className="p-2 rounded-xl border border-gray-200 bg-white min-w-[44px] min-h-[44px] flex items-center justify-center active:bg-gray-50"
          aria-label="翌月">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <ProgressBar done={doneCount} total={totalCount} />
      </div>

      {pendingCount === 0 && totalCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <Check size={18} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">今月のチェックが完了しています</p>
        </div>
      )}

      {/* モバイル: カード形式 */}
      <div className="md:hidden space-y-5">
        {Object.entries(grouped).map(([catName, catItems]) => (
          <div key={catName}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{catName}</p>
            <div className="space-y-2">
              {catItems.map((item) => {
                const done = doneItems[item.id]
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-24">状態</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-32">実施日時</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs w-36">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MONTHLY_CHECKLIST_ITEMS.map((item) => {
                const done = doneItems[item.id]
                return (
                  <tr key={item.id} className={done ? 'opacity-60' : ''}>
                    <td className="px-4 py-3">
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm break-anywhere ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5 break-anywhere">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${done ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {done ? '実施済み' : '未実施'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {done?.done_at ? format(new Date(done.done_at), 'M/d HH:mm', { locale: ja }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {!done ? (
                        <button onClick={() => handleDone(item.id)}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors min-h-[32px]">
                          実施済みにする
                        </button>
                      ) : (
                        <button onClick={() => handleUndone(item.id)} className="text-xs text-gray-400 underline">取り消す</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <Button variant="secondary" fullWidth onClick={() => navigate('/reports/new')}>
          <FileText size={16} />
          この結果から報告書を作成する
        </Button>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default MonthlyChecklist
