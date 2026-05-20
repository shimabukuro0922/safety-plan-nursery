import React, { useState } from 'react'
import { History, ClipboardCheck, AlertCircle, FileText } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { useChecklistStore, useNearMissStore, useChecklistItemsStore } from '@/stores/appStore'
import { NEAR_MISS_STEP_CONFIG } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

type Tab = 'all' | 'checklist' | 'nearmiss'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'all',       label: 'すべて',      icon: <History size={14} /> },
  { key: 'checklist', label: 'チェック表',  icon: <ClipboardCheck size={14} /> },
  { key: 'nearmiss',  label: 'ヒヤリハット', icon: <AlertCircle size={14} /> },
]

export const RecordList: React.FC = () => {
  const [tab, setTab] = useState<Tab>('all')
  const { doneItems } = useChecklistStore()
  const { nearMisses } = useNearMissStore()
  const { items: checklistItems } = useChecklistItemsStore()

  interface RecordEntry { id: string; type: Tab; title: string; date: string; meta?: string; icon: React.ReactNode; color: string }

  const checkRecords: RecordEntry[] = checklistItems
    .filter((item) => item.id in doneItems)
    .map((item) => {
      const done = doneItems[item.id]
      return {
        id: item.id, type: 'checklist' as Tab, title: item.title, date: done.done_at,
        meta: `実施者: ${done.done_by ?? '不明'} カテゴリ: ${item.categoryName}`,
        icon: <ClipboardCheck size={14} className="text-green-600" />, color: 'bg-green-50',
      }
    })

  const nearMissRecords: RecordEntry[] = nearMisses.map((nm) => ({
    id: nm.id, type: 'nearmiss' as Tab, title: nm.what_happened, date: nm.occurred_at,
    meta: `ステップ: ${NEAR_MISS_STEP_CONFIG[nm.step].label}`,
    icon: <AlertCircle size={14} className="text-orange-600" />, color: 'bg-orange-50',
  }))

  const allRecords = [...checkRecords, ...nearMissRecords]
  const filtered = tab === 'all' ? allRecords : allRecords.filter((r) => r.type === tab)
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader title="実施記録・証跡" subtitle="チェック表とヒヤリハットの実施記録がここに残ります" />

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px]
              ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon}
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
              {t.key === 'all' ? allRecords.length : allRecords.filter((r) => r.type === t.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">記録がありません</p>
            <p className="text-xs mt-1">チェック表を実施すると、ここに記録が残ります</p>
          </div>
        ) : sorted.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 ${record.color} rounded-lg flex items-center justify-center shrink-0`}>
                {record.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 break-anywhere leading-relaxed line-clamp-2">{record.title}</p>
                {record.meta && <p className="text-xs text-gray-500 mt-0.5 break-anywhere">{record.meta}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {record.date ? format(new Date(record.date), 'yyyy年M月d日', { locale: ja }) : '-'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="h-4" />
    </div>
  )
}

export default RecordList
