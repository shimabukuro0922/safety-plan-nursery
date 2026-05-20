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
    <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
      {/* ヘッダー */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1f2d27]">{motivationText}</p>
            <p className="text-xs text-[#6b7e74]">{doneCount} / {ONBOARDING_STEPS.length} 完了</p>
          </div>
        </div>
        {doneCount >= 2 && (
          <button
            onClick={onDismiss}
            className="p-1.5 text-[#8fa898] hover:text-[#6b7e74] transition-colors shrink-0"
            aria-label="ガイドを閉じる"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* プログレスバー */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
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
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150
                ${done
                  ? 'bg-white/60 cursor-default'
                  : 'bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.99] shadow-sm'
                }`}
            >
              <div className="shrink-0">
                {done
                  ? <CheckCircle2 size={20} className="text-emerald-500" />
                  : <Circle size={20} className="text-gray-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold break-anywhere ${done ? 'text-gray-400 line-through' : 'text-[#1f2d27]'}`}>
                  {step.label}
                </p>
                {!done && <p className="text-xs text-[#6b7e74] mt-0.5 break-anywhere">{step.desc}</p>}
              </div>
              {!done && <ChevronRight size={14} className="text-emerald-400 shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* 完了メッセージ or スキップボタン */}
      <div className="px-4 pb-4">
        {allDone ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-emerald-800">🎉 準備完了！</p>
            <p className="text-xs text-emerald-700 mt-0.5">安全管理をはじめましょう</p>
            <button onClick={onDismiss} className="mt-2 text-xs text-emerald-600 font-semibold underline">
              このガイドを閉じる
            </button>
          </div>
        ) : doneCount >= 2 ? (
          <button
            onClick={onDismiss}
            className="w-full text-xs text-[#8fa898] py-1 hover:text-[#6b7e74] transition-colors"
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
  { id: 'facility', label: '施設・設備点検',      path: '/checklists/monthly', icon: <Building2 size={18} className="text-teal-600" />,   iconBg: 'bg-teal-50' },
  { id: 'training', label: '訓練・研修',            path: '/records',            icon: <CalendarDays size={18} className="text-purple-500" />, iconBg: 'bg-purple-50' },
  { id: 'staff',    label: '職員共有',              path: '/materials/staff',    icon: <Users size={18} className="text-emerald-600" />,      iconBg: 'bg-emerald-50' },
  { id: 'nearmiss', label: 'ヒヤリハット振り返り',  path: '/near-miss',          icon: <AlertCircle size={18} className="text-amber-500" />,  iconBg: 'bg-amber-50' },
  { id: 'guardian', label: '保護者周知',            path: '/materials/guardian', icon: <Bell size={18} className="text-pink-500" />,          iconBg: 'bg-pink-50' },
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

  const trainingThisMonth = trainingRecords.some(
    (r) => r.completed_date.startsWith(currentYearMonth)
  )
  const nearMissThisMonth = nearMisses.some(
    (nm) => nm.occurred_at.startsWith(currentYearMonth)
  )

  const pillarDone: Record<string, boolean> = {
    facility: totalItems > 0 && doneCount >= Math.ceil(totalItems / 2),
    training: trainingThisMonth,
    staff:    nearMisses.length > 0,
    nearmiss: nearMissThisMonth && nearMissPending === 0,
    guardian: emergencyViewed,
  }
  const donePillars = Object.values(pillarDone).filter(Boolean).length
  const recentNearMisses = nearMisses.slice(0, 2)

  const checklistDone = checklistItems.length > 0
  const childrenDone = children.length > 0
  const showOnboarding = !dismissed && !(checklistDone && childrenDone && emergencyViewed)

  const todayKey = format(now, 'yyyy-MM-dd')
  const todayNapRecords = napRecords.filter((r) => r.date === todayKey)
  const lastNapCheck = [...todayNapRecords].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0]
  const napMinutesSinceLast = lastNapCheck
    ? Math.floor((now.getTime() - new Date(lastNapCheck.checked_at).getTime()) / 60000)
    : null

  return (
    <div className="px-4 py-6 space-y-6">

      {/* 施設名・日付ヘッダー */}
      <div className="pt-1">
        <p className="text-xs text-[#8fa898] font-medium">
          {format(now, 'yyyy年M月d日（E）', { locale: ja })}
        </p>
        <h1 className="text-xl font-extrabold text-[#1f2d27] mt-1 break-anywhere leading-tight">
          {facility?.name ?? 'まもりすと'}
        </h1>
        <p className="text-sm text-[#6b7e74] mt-1.5 leading-relaxed">
          今月は、これだけ確認すれば大丈夫です。
        </p>
      </div>

      {/* ウェルカムモーダル */}
      <WelcomeModal />

      {/* はじめにやること */}
      {showOnboarding && (
        <GettingStartedCard
          checklistItemsDone={checklistDone}
          childrenDone={childrenDone}
          emergencyDone={emergencyViewed}
          onDismiss={dismiss}
        />
      )}

      {/* 今月の安全管理進捗 */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-bold text-emerald-800">{monthLabel}の安全管理</p>
          <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {donePillars} / 5 完了
          </span>
        </div>
        <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(donePillars / 5) * 100}%` }}
          />
        </div>
        {doneCount === 0 ? (
          <p className="text-xs text-emerald-700 mt-2">チェック表から今月をスタートしましょう</p>
        ) : remaining > 0 ? (
          <p className="text-xs text-emerald-700 mt-2">チェック表：あと{remaining}つ整えると今月の記録がそろいます</p>
        ) : (
          <p className="text-xs text-emerald-700 mt-2">チェック表の記録が完了しています ✅</p>
        )}
      </div>

      {/* ヒヤリハット進行中アラート */}
      {nearMissPending > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50 cursor-pointer" onClick={() => navigate('/near-miss')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <p className="flex-1 text-sm text-amber-800 break-anywhere">
              ヒヤリハット <strong>{nearMissPending}件</strong> の改善が進行中です
            </p>
            <ChevronRight size={16} className="text-amber-400 shrink-0" />
          </div>
        </Card>
      )}

      {/* 今月やること */}
      <div>
        <SectionHeader title="今月やること" />
        <div className="space-y-2">
          {MONTHLY_PILLARS.map((pillar) => {
            const done = pillarDone[pillar.id]
            return (
              <Card key={pillar.id} className="p-4" onClick={() => navigate(pillar.path)}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${pillar.iconBg} flex items-center justify-center shrink-0`}>
                    {pillar.icon}
                  </div>
                  <p className="flex-1 text-sm font-semibold text-[#1f2d27] break-anywhere">{pillar.label}</p>
                  {done
                    ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    : <Circle size={20} className="text-gray-200 shrink-0" />
                  }
                  <ChevronRight size={16} className="text-[#8fa898] shrink-0" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>

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
              <button onClick={() => navigate('/near-miss')} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700">
                すべて見る <ChevronRight size={14} />
              </button>
            }
          />
          <div className="space-y-2">
            {recentNearMisses.map((nm) => {
              const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step] ?? NEAR_MISS_STEP_CONFIG['occurred']
              return (
                <Card key={nm.id} className="p-4" onClick={() => navigate('/near-miss')}>
                  <div className="flex items-start gap-2 justify-between">
                    <p className="text-sm font-semibold text-[#1f2d27] flex-1 break-anywhere line-clamp-2">{nm.what_happened}</p>
                    <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-semibold ${stepCfg.color}`}>{stepCfg.label}</span>
                  </div>
                  <p className="text-xs text-[#8fa898] mt-1.5">
                    {format(new Date(nm.occurred_at), 'M月d日', { locale: ja })} ・ {nm.created_by}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ヒヤリハット空状態 */}
      {nearMisses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-amber-400" />
          </div>
          <p className="text-sm font-bold text-[#1f2d27]">ヒヤリハットを記録しましょう</p>
          <p className="text-xs text-[#6b7e74] mt-1.5 mb-4 leading-relaxed break-anywhere">
            「転びそうになった」「気になった」など<br />小さなことを記録することで事故を防げます。
          </p>
          <button
            onClick={() => navigate('/near-miss')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={13} />
            最初の1件を記録する
          </button>
        </div>
      )}

      {/* 午睡見守り状況 */}
      {todayNapRecords.length > 0 && (
        <Card
          className={`p-4 ${
            napMinutesSinceLast === null ? '' :
            napMinutesSinceLast < 5  ? 'border-emerald-300 bg-emerald-50' :
            napMinutesSinceLast < 10 ? 'border-amber-300 bg-amber-50' :
            'border-red-300 bg-red-50'
          }`}
          onClick={() => navigate('/nap')}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              napMinutesSinceLast === null ? 'bg-gray-100' :
              napMinutesSinceLast < 5  ? 'bg-emerald-100' :
              napMinutesSinceLast < 10 ? 'bg-amber-100' :
              'bg-red-100'
            }`}>
              <Moon size={18} className={
                napMinutesSinceLast === null ? 'text-gray-400' :
                napMinutesSinceLast < 5  ? 'text-emerald-600' :
                napMinutesSinceLast < 10 ? 'text-amber-600' :
                'text-red-600'
              } />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${napMinutesSinceLast !== null && napMinutesSinceLast >= 10 ? 'text-red-800' : 'text-[#1f2d27]'}`}>
                午睡見守り
              </p>
              <p className="text-xs text-[#6b7e74] mt-0.5">
                本日 {todayNapRecords.length}回確認済み ·{' '}
                {napMinutesSinceLast === null ? '—' :
                 napMinutesSinceLast < 1 ? '直前に確認' :
                 `最終確認 ${napMinutesSinceLast}分前`}
                {napMinutesSinceLast !== null && napMinutesSinceLast >= 10 && ' ⚠️'}
              </p>
            </div>
            <ChevronRight size={16} className="text-[#8fa898] shrink-0" />
          </div>
        </Card>
      )}

      {/* 現場サポートツール */}
      <div>
        <SectionHeader title="現場サポートツール" />
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => navigate('/emergency')}
            className="flex flex-col items-center gap-2.5 p-4 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Siren size={22} className="text-red-500" />
            </div>
            <span className="text-xs font-bold text-red-700 text-center leading-tight">緊急対応<br />カード</span>
          </button>
          <button
            onClick={() => navigate('/nap')}
            className="flex flex-col items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Moon size={22} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-700 text-center leading-tight">午睡<br />見守り記録</span>
          </button>
          <button
            onClick={() => navigate('/photos')}
            className="flex flex-col items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Camera size={22} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-700 text-center leading-tight">写真<br />管理</span>
          </button>
        </div>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default Dashboard
