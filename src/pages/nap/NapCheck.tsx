import React, { useState, useEffect } from 'react'
import { Moon, CheckCircle2, Clock, Trash2, Users, Settings, X, Check } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { useNapCheckStore, useNapSettingsStore } from '@/stores/appStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

const INTERVAL_PRESETS = [3, 5, 10, 15]

export const NapCheck: React.FC = () => {
  const { facility } = useFacilityStore()
  const { records, addRecord, clearToday } = useNapCheckStore()
  const { intervalMinutes, setIntervalMinutes } = useNapSettingsStore()

  const [checkerName, setCheckerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [customInput, setCustomInput] = useState(String(intervalMinutes))

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

  // 間隔に応じたアラート色（設定値の80%・100%・120%を閾値に）
  const threshold1 = intervalMinutes * 0.8   // 良好
  const threshold2 = intervalMinutes         // 注意
  const alertColor =
    minutesSinceLast === null ? 'bg-gray-100 text-gray-500' :
    minutesSinceLast < threshold1 ? 'bg-green-100 text-green-700' :
    minutesSinceLast < threshold2 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700'

  const handleCheck = () => {
    if (submitting) return
    if (!checkerName.trim()) {
      toast.error('確認担当者名を入力してください')
      return
    }
    setSubmitting(true)
    addRecord({ date: todayKey, checked_at: new Date().toISOString(), checked_by: checkerName.trim() })
    toast.success(`${format(new Date(), 'HH:mm')} 確認を記録しました`)
    setTimeout(() => setSubmitting(false), 1500)
  }

  const handleClear = () => {
    if (window.confirm('本日の記録をすべて削除しますか？')) {
      clearToday(todayKey)
      toast.success('本日の記録を削除しました')
    }
  }

  const handleSaveInterval = () => {
    const v = parseInt(customInput, 10)
    if (isNaN(v) || v < 1 || v > 60) {
      toast.error('1〜60の数値を入力してください')
      return
    }
    setIntervalMinutes(v)
    setShowSettings(false)
    toast.success(`確認間隔を${v}分に設定しました`)
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="午睡見守り記録"
        subtitle={`${intervalMinutes}分ごとに呼吸・体位を確認してボタンを押してください`}
        action={
          <button
            onClick={() => { setShowSettings((v) => !v); setCustomInput(String(intervalMinutes)) }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white transition-colors"
          >
            <Settings size={13} />
            間隔設定
          </button>
        }
      />

      {/* 間隔設定パネル */}
      {showSettings && (
        <Card className="p-4 border-blue-200 bg-blue-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">確認間隔を設定</p>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={16} />
            </button>
          </div>

          {/* プリセット */}
          <div>
            <p className="text-xs text-gray-500 mb-2">よく使う間隔</p>
            <div className="flex gap-2 flex-wrap">
              {INTERVAL_PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => { setIntervalMinutes(min); setCustomInput(String(min)); setShowSettings(false); toast.success(`確認間隔を${min}分に設定しました`) }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    intervalMinutes === min
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {min}分
                </button>
              ))}
            </div>
          </div>

          {/* カスタム入力 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">その他（1〜60分で入力）</p>
            <div className="flex gap-2">
              <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden flex-1">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInterval()}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                />
                <span className="text-sm text-gray-500 pr-3">分</span>
              </div>
              <button
                onClick={handleSaveInterval}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Check size={14} /> 設定
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">現在の設定: <strong className="text-blue-700">{intervalMinutes}分ごと</strong></p>
        </Card>
      )}

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
          ) : minutesSinceLast < threshold1 ? (
            <p className="text-sm font-medium">前回確認から <strong>{minutesSinceLast}</strong> 分経過（良好）</p>
          ) : minutesSinceLast < threshold2 ? (
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
