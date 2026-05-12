import React, { useState } from 'react'
import { Sun, Wind, Snowflake, Flower2, CheckCircle2, Circle } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { useSeasonalChecklistStore } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import toast from 'react-hot-toast'

interface SeasonItem {
  key: string
  label: string
}

interface Season {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  items: SeasonItem[]
}

const SEASONS: Season[] = [
  {
    key: 'spring',
    label: '春季（3〜4月）',
    icon: <Flower2 size={20} className="text-pink-500" />,
    color: 'bg-pink-50 border-pink-200',
    items: [
      { key: 'spring_pool',   label: 'プール開き前点検' },
      { key: 'spring_trip',   label: '春季遠足の安全確認' },
      { key: 'spring_new',    label: '新入園児安全オリエンテーション' },
      { key: 'spring_equip',  label: '園庭遊具の点検・整備' },
    ],
  },
  {
    key: 'summer',
    label: '夏季（6〜7月）',
    icon: <Sun size={20} className="text-yellow-500" />,
    color: 'bg-yellow-50 border-yellow-200',
    items: [
      { key: 'summer_pool',   label: 'プール・水遊び安全確認' },
      { key: 'summer_heat',   label: '熱中症対策確認（日陰・水分補給）' },
      { key: 'summer_aed',    label: 'AED・救急備品チェック' },
      { key: 'summer_sunstroke', label: '職員への熱中症対応研修' },
    ],
  },
  {
    key: 'autumn',
    label: '秋季（9〜10月）',
    icon: <Wind size={20} className="text-orange-500" />,
    color: 'bg-orange-50 border-orange-200',
    items: [
      { key: 'autumn_trip',   label: '秋季遠足の安全確認' },
      { key: 'autumn_drill',  label: '避難訓練実施' },
      { key: 'autumn_crime',  label: '防犯・不審者対応確認' },
      { key: 'autumn_equip',  label: '遊具・施設の秋季点検' },
    ],
  },
  {
    key: 'winter',
    label: '冬季（12〜1月）',
    icon: <Snowflake size={20} className="text-blue-500" />,
    color: 'bg-blue-50 border-blue-200',
    items: [
      { key: 'winter_heat',   label: '暖房器具安全点検' },
      { key: 'winter_infect', label: '感染症対策確認（インフルエンザ等）' },
      { key: 'winter_route',  label: '避難経路の確認' },
      { key: 'winter_fire',   label: '防火・火災避難訓練' },
    ],
  },
]

export const SeasonalChecklist: React.FC = () => {
  const { doneItems, markDone, markUndone, isDone } = useSeasonalChecklistStore()
  const { facility } = useFacilityStore()
  const [staffName, setStaffName] = useState(facility?.director_name ?? '')

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

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="季節前チェック表"
        subtitle="季節ごとの安全確認項目をチェックして記録します"
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

      <div className="space-y-3">
        {SEASONS.map((season) => {
          const doneCount = season.items.filter((item) => isDone(item.key)).length
          return (
            <Card key={season.key} className={`p-4 border-2 ${season.color}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {season.icon}
                  <p className="text-sm font-bold text-gray-900">{season.label}</p>
                </div>
                <span className="text-xs text-gray-500">{doneCount}/{season.items.length}</span>
              </div>
              <ul className="space-y-2">
                {season.items.map((item) => {
                  const done = isDone(item.key)
                  const record = doneItems[item.key]
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => handleToggle(item.key, item.label)}
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
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>
      <div className="h-4" />
    </div>
  )
}

export default SeasonalChecklist
