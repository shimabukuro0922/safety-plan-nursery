import React, { useState, useEffect } from 'react'
import { Moon, CheckCircle2, Clock, Trash2, Users } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { useNapCheckStore } from '@/stores/appStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

export const NapCheck: React.FC = () => {
  const { facility } = useFacilityStore()
  const { records, addRecord, clearToday } = useNapCheckStore()
  const [checkerName, setCheckerName] = useState(facility?.director_name ?? '')
  const [submitting, setSubmitting] = useState(false)

  // 設定画面で施設長名が変更されたとき確認者名に反映する
  useEffect(() => {
    if (facility?.director_name) setCheckerName(facility.director_name)
  }, [facility?.director_name])

  // 30秒ごとに再レンダリングして経過時間を最新に保つ
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const now = new Date()
  const todayKey = format(now, 'yyyy-MM-dd')
  const todayRecords = records
    .filter((r) => r.date === todayKey)
    .sort((a, b) => b.checked_at.localeCompare(a.checked_at))

  const lastCheck = todayRecords[0]
  const minutesSinceLast = lastCheck
    ? Math.floor((Date.now() - new Date(lastCheck.checked_at).getTime()) / 60000)
    : null

  const handleCheck = () => {
    if (submitting) return
    setSubmitting(true)
    const name = checkerName.trim() || '未記入'
    addRecord({ date: todayKey, checked_at: new Date().toISOString(), checked_by: name })
    toast.success(`${format(new Date(), 'HH:mm')} 確認を記録しました`)
    setTimeout(() => setSubmitting(false), 1500)
  }

  const handleClear = () => {
    if (window.confirm('本日の記録をすべて削除しますか？')) {
      clearToday(todayKey)
      toast.success('本日の記録を削除しました')
    }
  }

  const alertColor =
    minutesSinceLast === null ? 'bg-gray-100 text-gray-500' :
    minutesSinceLast < 5 ? 'bg-green-100 text-green-700' :
    minutesSinceLast < 10 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700'

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="午睡見守り記録"
        subtitle="5分ごとに呼吸・体位を確認してボタンを押してください"
      />

      {/* 担当者 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <label className="text-xs font-semibold text-gray-600 block mb-2">
          <Users size={12} className="inline mr-1" />
          確認担当者名
        </label>
        <input
          type="text"
          value={checkerName}
          onChange={(e) => setCheckerName(e.target.value)}
          placeholder="例：山田 花子"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* 経過時間表示 */}
      <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${alertColor}`}>
        <Clock size={18} className="shrink-0" />
        <div>
          {minutesSinceLast === null ? (
            <p className="text-sm font-medium">まだ本日の記録がありません</p>
          ) : minutesSinceLast < 5 ? (
            <p className="text-sm font-medium">前回確認から <strong>{minutesSinceLast}</strong> 分経過（良好）</p>
          ) : minutesSinceLast < 10 ? (
            <p className="text-sm font-medium">前回確認から <strong>{minutesSinceLast}</strong> 分経過 — そろそろ確認を</p>
          ) : (
            <p className="text-sm font-bold">前回確認から <strong>{minutesSinceLast}</strong> 分経過 ⚠️ 確認してください</p>
          )}
          {lastCheck && (
            <p className="text-xs mt-0.5 opacity-75">
              最終確認: {format(new Date(lastCheck.checked_at), 'HH:mm', { locale: ja })} ({lastCheck.checked_by})
            </p>
          )}
        </div>
      </div>

      {/* 確認ボタン */}
      <button
        onClick={handleCheck}
        disabled={submitting}
        className="w-full flex flex-col items-center justify-center gap-1 py-8 bg-blue-600 text-white rounded-2xl shadow-md active:bg-blue-700 transition-colors min-h-[120px] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Moon size={32} />
        <span className="text-lg font-bold mt-1">午睡確認しました</span>
        <span className="text-xs opacity-80">タップして記録</span>
      </button>

      {/* 本日の記録 */}
      {todayRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">
              本日の記録（{format(now, 'M月d日', { locale: ja })}）— {todayRecords.length}回
            </p>
            <button onClick={handleClear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={11} /> 削除
            </button>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {todayRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-800">
                      {format(new Date(r.checked_at), 'HH:mm', { locale: ja })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{r.checked_by}</span>
                </div>
              ))}
            </div>
          </Card>
          <p className="text-xs text-gray-400 mt-1 text-center">
            合計確認回数: {todayRecords.length}回
          </p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-800 leading-relaxed">
          ⚠️ 午睡中は顔色・呼吸の有無・体位（うつ伏せになっていないか）を必ず確認してください。
          うつ伏せを発見した場合は仰向けに直してください。
        </p>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default NapCheck
