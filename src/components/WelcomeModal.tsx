import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Siren, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { useOnboardingStore } from '@/stores/appStore'

const QUICK_STARTS = [
  {
    icon: <ClipboardCheck size={18} className="text-blue-500" />,
    label: '月次チェック表を確認する',
    desc: '毎月確認するチェック項目をさっと見てみましょう',
    path: '/checklists/monthly',
    bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    icon: <Siren size={18} className="text-red-500" />,
    label: '緊急対応カードを確認する',
    desc: '誤嚥・アナフィラキシー等の手順を職員で共有できます',
    path: '/emergency',
    bg: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
  {
    icon: <AlertCircle size={18} className="text-orange-500" />,
    label: 'ヒヤリハットを試しに記録する',
    desc: '小さな「あれ？」を記録する習慣から始めましょう',
    path: '/near-miss',
    bg: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
]

export const WelcomeModal: React.FC = () => {
  const navigate = useNavigate()
  const { facility } = useFacilityStore()
  const { showWelcome, setShowWelcome } = useOnboardingStore()

  if (!showWelcome) return null

  const handleAction = (path: string) => {
    setShowWelcome(false)
    navigate(path)
  }

  const handleSkip = () => {
    setShowWelcome(false)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* グラデーションヘッダー */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <p className="text-white/80 text-sm font-medium">ようこそ！</p>
          <p className="text-white text-xl font-bold mt-0.5 break-anywhere">
            {facility?.name ?? ''}
          </p>
          <p className="text-white/70 text-sm mt-1">の安全管理がはじまります</p>
        </div>

        {/* クイックスタート3選 */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-sm font-bold text-gray-800 mb-3">まず3つ、確認してみましょう</p>
          <div className="space-y-2">
            {QUICK_STARTS.map((item) => (
              <button
                key={item.path}
                onClick={() => handleAction(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${item.bg}`}
              >
                <div className="shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 break-anywhere">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 break-anywhere">{item.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* フッター CTA */}
        <div className="px-5 pt-4 pb-6 space-y-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => handleAction('/checklists/monthly')}
          >
            <ClipboardCheck size={18} />
            チェック表からはじめる
          </Button>
          <button
            onClick={handleSkip}
            className="w-full text-xs text-gray-400 py-2 hover:text-gray-600 transition-colors"
          >
            あとで自分で設定する
          </button>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal
