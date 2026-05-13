import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck, ChevronRight, CalendarDays,
  AlertCircle, Users, Bell, Building2, CheckCircle2, Circle,
  Moon, GraduationCap, Siren,
} from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useNearMissStore, useChecklistStore, useChecklistItemsStore, useNapCheckStore } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import { NEAR_MISS_STEP_CONFIG } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const MONTHLY_PILLARS = [
  { id: 'facility', label: '施設・設備点検',      path: '/checklists/monthly', icon: <Building2 size={18} className="text-blue-500" /> },
  { id: 'training', label: '訓練・研修',            path: '/records',            icon: <CalendarDays size={18} className="text-purple-500" /> },
  { id: 'staff',    label: '職員共有',              path: '/materials/staff',    icon: <Users size={18} className="text-green-500" /> },
  { id: 'nearmiss', label: 'ヒヤリハット振り返り',  path: '/near-miss',          icon: <AlertCircle size={18} className="text-orange-500" /> },
  { id: 'guardian', label: '保護者周知',            path: '/materials/guardian', icon: <Bell size={18} className="text-pink-500" /> },
]

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { facility } = useFacilityStore()
  const { nearMisses } = useNearMissStore()
  const { doneItems } = useChecklistStore()
  const { items: checklistItems } = useChecklistItemsStore()
  const { records: napRecords } = useNapCheckStore()

  const now = new Date()
  const monthLabel = format(now, 'M月', { locale: ja })

  const totalItems = checklistItems.length
  const doneCount = checklistItems.filter((item) => item.id in doneItems).length
  const remaining = totalItems - doneCount

  const nearMissPending = nearMisses.filter(
    (nm) => nm.step === 'occurred' || nm.step === 'cause' || nm.step === 'action'
  ).length

  const pillarDone: Record<string, boolean> = {
    facility: totalItems > 0 && doneCount >= Math.ceil(totalItems / 2),
    training: false,
    staff: false,
    nearmiss: nearMisses.length > 0 && nearMissPending === 0,
    guardian: false,
  }
  const donePillars = Object.values(pillarDone).filter(Boolean).length
  const recentNearMisses = nearMisses.slice(0, 2)

  // 今日の午睡見守り状況
  const todayKey = format(now, 'yyyy-MM-dd')
  const todayNapRecords = napRecords.filter((r) => r.date === todayKey)
  const lastNapCheck = todayNapRecords.sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0]
  const napMinutesSinceLast = lastNapCheck
    ? Math.floor((Date.now() - new Date(lastNapCheck.checked_at).getTime()) / 60000)
    : null

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <p className="text-xs text-gray-500">
          {format(now, 'yyyy年M月d日（E）', { locale: ja })}
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5 break-anywhere">
          {facility?.name ?? ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">今月は、これだけ確認すれば大丈夫です。</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-blue-800">{monthLabel}の安全管理</p>
          <span className="text-sm font-bold text-blue-700">{donePillars} / 5 完了</span>
        </div>
        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(donePillars / 5) * 100}%` }} />
        </div>
        {doneCount === 0 ? (
          <p className="text-xs text-blue-600 mt-2">チェック表から今月をスタートしましょう</p>
        ) : remaining > 0 ? (
          <p className="text-xs text-blue-600 mt-2">チェック表：あと{remaining}つ整えると今月の記録がそろいます</p>
        ) : (
          <p className="text-xs text-blue-600 mt-2">チェック表の記録が完了しています</p>
        )}
      </div>

      <div>
        <SectionHeader title="今月やること" />
        <div className="space-y-2">
          {MONTHLY_PILLARS.map((pillar) => {
            const done = pillarDone[pillar.id]
            return (
              <Card key={pillar.id} className="p-4" onClick={() => navigate(pillar.path)}>
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{pillar.icon}</div>
                  <p className="flex-1 text-sm font-medium text-gray-800 break-anywhere">{pillar.label}</p>
                  {done ? <CheckCircle2 size={20} className="text-green-500 shrink-0" /> : <Circle size={20} className="text-gray-300 shrink-0" />}
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {nearMissPending > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50" onClick={() => navigate('/near-miss')}>
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-orange-500 shrink-0" />
            <p className="flex-1 text-sm text-orange-800 break-anywhere">
              ヒヤリハット <strong>{nearMissPending}件</strong>の改善が進行中です
            </p>
            <ChevronRight size={16} className="text-orange-400 shrink-0" />
          </div>
        </Card>
      )}

      <div className="space-y-2.5">
        <Button variant="primary" fullWidth size="lg" onClick={() => navigate('/checklists/monthly')}>
          <ClipboardCheck size={18} />
          今月のチェック表を開く
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/near-miss')}>
          <AlertCircle size={16} />
          ヒヤリハットを記録する
        </Button>
      </div>

      {recentNearMisses.length > 0 && (
        <div>
          <SectionHeader
            title="ヒヤリハット改善ノート"
            action={
              <button onClick={() => navigate('/near-miss')} className="text-xs text-blue-600 flex items-center gap-1">
                すべて見る <ChevronRight size={14} />
              </button>
            }
          />
          <div className="space-y-2">
            {recentNearMisses.map((nm) => {
              const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step]
              return (
                <Card key={nm.id} className="p-4 cursor-pointer" onClick={() => navigate('/near-miss')}>
                  <div className="flex items-start gap-2 justify-between">
                    <p className="text-sm font-medium text-gray-900 flex-1 break-anywhere line-clamp-2">{nm.what_happened}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${stepCfg.color}`}>{stepCfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {format(new Date(nm.occurred_at), 'M月d日', { locale: ja })} ・ {nm.created_by}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {nearMisses.length === 0 && (
        <Card className="p-4 bg-gray-50 border-dashed text-center" onClick={() => navigate('/near-miss')}>
          <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 break-anywhere">
            ヒヤリハット記録はまだありません。<br />気になることを小さくても記録しておきましょう。
          </p>
        </Card>
      )}

      {/* 午睡見守り状況 */}
      {todayNapRecords.length > 0 && (
        <Card
          className={`p-4 cursor-pointer ${
            napMinutesSinceLast === null ? 'border-gray-200' :
            napMinutesSinceLast < 5  ? 'border-green-300 bg-green-50' :
            napMinutesSinceLast < 10 ? 'border-yellow-300 bg-yellow-50' :
            'border-red-300 bg-red-50'
          }`}
          onClick={() => navigate('/nap')}
        >
          <div className="flex items-center gap-3">
            <Moon size={20} className={
              napMinutesSinceLast === null ? 'text-gray-400' :
              napMinutesSinceLast < 5  ? 'text-green-600' :
              napMinutesSinceLast < 10 ? 'text-yellow-600' :
              'text-red-600'
            } />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${
                napMinutesSinceLast !== null && napMinutesSinceLast >= 10 ? 'text-red-800' : 'text-gray-900'
              }`}>午睡見守り</p>
              <p className="text-xs text-gray-600 mt-0.5">
                本日 {todayNapRecords.length}回確認済み ·{' '}
                {napMinutesSinceLast === null ? '—' :
                 napMinutesSinceLast < 1 ? '直前に確認' :
                 `最終確認 ${napMinutesSinceLast}分前`}
                {napMinutesSinceLast !== null && napMinutesSinceLast >= 10 && ' ⚠️'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-400 shrink-0" />
          </div>
        </Card>
      )}

      {/* 現場サポートツール */}
      <div>
        <SectionHeader title="現場サポートツール" />
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('/emergency')}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl hover:bg-red-100 transition-colors"
          >
            <Siren size={24} className="text-red-500" />
            <span className="text-xs font-semibold text-red-700 text-center leading-tight">緊急対応<br />カード</span>
          </button>
          <button
            onClick={() => navigate('/nap')}
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors"
          >
            <Moon size={24} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 text-center leading-tight">午睡<br />見守り記録</span>
          </button>
          <button
            onClick={() => navigate('/training')}
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 border border-purple-200 rounded-2xl hover:bg-purple-100 transition-colors"
          >
            <GraduationCap size={24} className="text-purple-500" />
            <span className="text-xs font-semibold text-purple-700 text-center leading-tight">職員研修<br />資格管理</span>
          </button>
        </div>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default Dashboard
