import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck, ChevronRight, CalendarDays,
  AlertCircle, Users, Bell, Building2, CheckCircle2, Circle,
  Moon, Siren, Camera, X, Sparkles, Plus,
} from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import {
  useNearMissStore, useChecklistStore, useChecklistItemsStore,
  useNapCheckStore, useOnboardingStore, useStaffTrainingStore,
} from '@/stores/appStore'
import { WelcomeModal } from '@/components/WelcomeModal'
import { useFacilityStore } from '@/stores/facilityStore'
import { useChildrenStore } from '@/stores/childrenStore'
import { NEAR_MISS_STEP_CONFIG } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

// ==============================
// はじめにやることガイドカード
// ==============================
const ONBOARDING_STEPS = [
  {
    id: 'facility',
    label: '施設情報を登録する',
    desc: '施設名・園長名を登録します',
    path: '/settings',
    alwaysDone: true,
  },
  {
    id: 'checklist',
    label: '月次チェック項目を設定する',
    desc: '毎月確認するチェックリストを作りましょう',
    path: '/checklists/monthly',
  },
  {
    id: 'children',
    label: '園児情報を登録する',
    desc: '写真NG設定など写真管理に必要です',
    path: '/children',
  },
  {
    id: 'emergency',
    label: '緊急対応カードを確認する',
    desc: '職員全員に周知しておきましょう',
    path: '/emergency',
  },
]

const GettingStartedCard: React.FC<{
  checklistItemsDone: boolean
  childrenDone: boolean
  emergencyDone: boolean
  onDismiss: () => void
}> = ({ checklistItemsDone, childrenDone, emergencyDone, onDismiss }) => {
  const navigate = useNavigate()

  const stepStates = [true, checklistItemsDone, childrenDone, emergencyDone]
  const doneCount = stepStates.filter(Boolean).length
  const allDone = doneCount === ONBOARDING_STEPS.length
  const remaining = ONBOARDING_STEPS.length - doneCount

  const motivationText = allDone
    ? '✅ セットアップ完了！'
    : doneCount >= 3
    ? `あと${remaining}つで完了です！`
    : doneCount >= 2
    ? 'いい調子です！続けましょう'
    : 'まず最初にこれだけ設定を'

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{motivationText}</p>
            <p className="text-xs text-gray-500">{doneCount} / {ONBOARDING_STEPS.length} 完了</p>
          </div>
        </div>
        {doneCount >= 2 && (
          <button
            onClick={onDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="ガイドを閉じる"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* プログレスバー */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${(doneCount / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ステップ一覧 */}
      <div className="px-4 pb-4 space-y-2">
        {ONBOARDING_STEPS.map((step, i) => {
          const done = stepStates[i]
          return (
            <button
              key={step.id}
              onClick={() => !done && navigate(step.path)}
              disabled={done}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors
                ${done
                  ? 'bg-white/60 cursor-default'
                  : 'bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100'
                }`}
            >
              <div className="shrink-0">
                {done
                  ? <CheckCircle2 size={20} className="text-green-500" />
                  : <Circle size={20} className="text-gray-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium break-anywhere ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {step.label}
                </p>
                {!done && <p className="text-xs text-gray-500 mt-0.5 break-anywhere">{step.desc}</p>}
              </div>
              {!done && <ChevronRight size={14} className="text-blue-400 shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* 完了メッセージ or スキップボタン */}
      <div className="px-4 pb-4">
        {allDone ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-green-800">🎉 準備完了！</p>
            <p className="text-xs text-green-700 mt-0.5">安全管理をはじめましょう</p>
            <button onClick={onDismiss} className="mt-2 text-xs text-green-600 font-medium underline">
              このガイドを閉じる
            </button>
          </div>
        ) : doneCount >= 2 ? (
          <button
            onClick={onDismiss}
            className="w-full text-xs text-gray-400 py-1 hover:text-gray-600 transition-colors"
          >
            あとで設定する · このガイドを閉じる
          </button>
        ) : (
          <button
            onClick={onDismiss}
            className="w-full text-xs text-gray-300 py-1 hover:text-gray-400 transition-colors"
          >
            今はスキップする
          </button>
        )}
      </div>
    </div>
  )
}

// ==============================
// ダッシュボード
// ==============================
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

  const { records: trainingRecords } = useStaffTrainingStore()
  const { children } = useChildrenStore()
  const { dismissed, dismiss, emergencyViewed } = useOnboardingStore()

  const now = new Date()
  const monthLabel = format(now, 'M月', { locale: ja })
  const currentYearMonth = format(now, 'yyyy-MM')

  const totalItems = checklistItems.length
  const doneCount = checklistItems.filter((item) => item.id in doneItems).length
  const remaining = totalItems - doneCount

  const nearMissPending = nearMisses.filter(
    (nm) => nm.step === 'occurred' || nm.step === 'cause' || nm.step === 'action'
  ).length

  // 今月の研修記録があるか
  const trainingThisMonth = trainingRecords.some(
    (r) => r.completed_date.startsWith(currentYearMonth)
  )
  // 今月のヒヤリハットがあるか（対策済みも含む）
  const nearMissThisMonth = nearMisses.some(
    (nm) => nm.occurred_at.startsWith(currentYearMonth)
  )

  const pillarDone: Record<string, boolean> = {
    facility: totalItems > 0 && doneCount >= Math.ceil(totalItems / 2),
    training: trainingThisMonth,
    staff:    nearMisses.length > 0,   // ヒヤリハットを共有資料として活用
    nearmiss: nearMissThisMonth && nearMissPending === 0,
    guardian: emergencyViewed,          // 緊急対応確認を保護者周知の代替指標に
  }
  const donePillars = Object.values(pillarDone).filter(Boolean).length
  const recentNearMisses = nearMisses.slice(0, 2)

  // オンボーディング進捗
  const checklistDone = checklistItems.length > 0
  const childrenDone = children.length > 0
  const showOnboarding = !dismissed && !(checklistDone && childrenDone && emergencyViewed)

  // 今日の午睡見守り状況
  const todayKey = format(now, 'yyyy-MM-dd')
  const todayNapRecords = napRecords.filter((r) => r.date === todayKey)
  const lastNapCheck = [...todayNapRecords].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0]
  const napMinutesSinceLast = lastNapCheck
    ? Math.floor((now.getTime() - new Date(lastNapCheck.checked_at).getTime()) / 60000)
    : null

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 施設名・日付 */}
      <div>
        <p className="text-xs text-gray-500">
          {format(now, 'yyyy年M月d日（E）', { locale: ja })}
        </p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5 break-anywhere">
          {facility?.name ?? ''}
        </h1>
        <p className="text-sm text-gray-500 mt-1">今月は、これだけ確認すれば大丈夫です。</p>
      </div>

      {/* はじめにやることガイド */}
      <WelcomeModal />

      {showOnboarding && (
        <GettingStartedCard
          checklistItemsDone={checklistDone}
          childrenDone={childrenDone}
          emergencyDone={emergencyViewed}
          onDismiss={dismiss}
        />
      )}

      {/* 今月の安全管理進捗 */}
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
          <p className="text-xs text-blue-600 mt-2">チェック表の記録が完了しています ✅</p>
        )}
      </div>

      {/* 今月やること */}
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

      {/* ヒヤリハット進行中アラート */}
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

      {/* クイックボタン */}
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

      {/* ヒヤリハット一覧 */}
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
              const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step] ?? NEAR_MISS_STEP_CONFIG['occurred']
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
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-5 text-center">
          <AlertCircle size={28} className="text-orange-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">ヒヤリハットを記録しましょう</p>
          <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed break-anywhere">
            「転びそうになった」「気になった」など<br />小さなことを記録することで事故を防げます。
          </p>
          <button
            onClick={() => navigate('/near-miss')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
          >
            <Plus size={13} />
            最初の1件を記録する
          </button>
        </div>
      )}

      {/* 午睡見守り状況（本日記録がある場合のみ） */}
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
              <p className={`text-sm font-semibold ${napMinutesSinceLast !== null && napMinutesSinceLast >= 10 ? 'text-red-800' : 'text-gray-900'}`}>
                午睡見守り
              </p>
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
            onClick={() => navigate('/photos')}
            className="flex flex-col items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-2xl hover:bg-green-100 transition-colors"
          >
            <Camera size={24} className="text-green-500" />
            <span className="text-xs font-semibold text-green-700 text-center leading-tight">写真<br />管理</span>
          </button>
        </div>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default Dashboard
