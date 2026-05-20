import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardCheck, History,
  FileText, Settings, ChevronLeft,
  ShieldCheck, CalendarDays, AlertCircle, Users, Bell, HelpCircle,
  Moon, GraduationCap, Siren, MoreHorizontal, X, Camera, LogOut,
} from 'lucide-react'
import { GuideModal } from '@/components/GuideModal'
import { useFacilityStore } from '@/stores/facilityStore'
import { clearDemoData } from '@/lib/demo'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { label: 'ホーム',   path: '/dashboard',         icon: <LayoutDashboard size={22} /> },
  { label: 'チェック', path: '/checklists/monthly', icon: <ClipboardCheck size={22} /> },
  { label: '写真',     path: '/photos',             icon: <Camera size={22} /> },
  { label: '午睡',     path: '/nap',                icon: <Moon size={22} /> },
  { label: 'もっと',   path: '',                    icon: <MoreHorizontal size={22} /> },
]

const MORE_ITEMS = [
  { label: '園児管理',           path: '/children',              icon: <Users size={22} className="text-indigo-500" /> },
  { label: 'ヒヤリハット',       path: '/near-miss',             icon: <AlertCircle size={22} className="text-amber-500" /> },
  { label: '緊急対応カード',     path: '/emergency',             icon: <Siren size={22} className="text-red-500" /> },
  { label: '職員研修・資格',     path: '/training',              icon: <GraduationCap size={22} className="text-purple-500" /> },
  { label: '実施記録・証跡',     path: '/records',               icon: <History size={22} className="text-emerald-600" /> },
  { label: '報告書',             path: '/reports',               icon: <FileText size={22} className="text-slate-500" /> },
  { label: '年間カレンダー',     path: '/plans',                 icon: <CalendarDays size={22} className="text-teal-500" /> },
  { label: '季節前チェック',     path: '/checklists/seasonal',  icon: <ClipboardCheck size={22} className="text-teal-500" /> },
  { label: '職員共有シート',     path: '/materials/staff',      icon: <Users size={22} className="text-amber-500" /> },
  { label: '保護者周知文',       path: '/materials/guardian',   icon: <Bell size={22} className="text-pink-500" /> },
  { label: '設定',               path: '/settings',              icon: <Settings size={22} className="text-slate-500" /> },
]

const PC_NAV_ITEMS = [
  {
    section: '毎月の運用',
    items: [
      { label: 'ホーム（今月やること）', path: '/dashboard',          icon: <LayoutDashboard size={15} /> },
      { label: '月次チェック表',         path: '/checklists/monthly', icon: <ClipboardCheck size={15} /> },
      { label: 'ヒヤリハット改善ノート', path: '/near-miss',          icon: <AlertCircle size={15} /> },
    ],
  },
  {
    section: '年間計画',
    items: [
      { label: '年間安全カレンダー', path: '/plans',                icon: <CalendarDays size={15} /> },
      { label: '季節前チェック',     path: '/checklists/seasonal', icon: <ClipboardCheck size={15} /> },
    ],
  },
  {
    section: '共有・周知',
    items: [
      { label: '職員共有シート', path: '/materials/staff',    icon: <Users size={15} /> },
      { label: '保護者周知文',   path: '/materials/guardian', icon: <Bell size={15} /> },
    ],
  },
  {
    section: '記録・報告',
    items: [
      { label: '実施記録・証跡', path: '/records', icon: <History size={15} /> },
      { label: '報告書',         path: '/reports', icon: <FileText size={15} /> },
    ],
  },
  {
    section: '写真管理',
    items: [
      { label: '写真管理', path: '/photos',    icon: <Camera size={15} /> },
      { label: '園児管理', path: '/children',  icon: <Users size={15} /> },
    ],
  },
  {
    section: '現場サポート',
    items: [
      { label: '緊急対応カード',     path: '/emergency', icon: <Siren size={15} /> },
      { label: '午睡見守り記録',     path: '/nap',       icon: <Moon size={15} /> },
      { label: '職員研修・資格管理', path: '/training',  icon: <GraduationCap size={15} /> },
    ],
  },
  {
    section: '管理',
    items: [
      { label: '設定', path: '/settings', icon: <Settings size={15} /> },
    ],
  },
]

const Sidebar: React.FC = () => {
  const [guideOpen, setGuideOpen] = useState(false)
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-[#e2ece6] z-40 overflow-y-auto">
      {/* ロゴエリア */}
      <div className="px-5 py-5 border-b border-[#e2ece6]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#1f2d27] leading-tight tracking-tight">まもりすと</p>
            <p className="text-[11px] text-[#6b7e74] leading-tight mt-0.5">園長の安全管理サポート</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {PC_NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-bold text-[#6b7e74] uppercase tracking-widest px-2 mb-1.5">
              {group.section}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-[#4a6057] hover:bg-emerald-50 hover:text-emerald-700'
                  }`
                }
              >
                {item.icon}
                <span className="break-anywhere">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* フッター */}
      <div className="px-5 py-4 border-t border-[#e2ece6]">
        <button
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-2 text-xs text-[#6b7e74] hover:text-emerald-700 transition-colors w-full py-1"
        >
          <HelpCircle size={14} />
          操作ガイドを見る
        </button>
      </div>
      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </aside>
  )
}

const BottomNav: React.FC = () => {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#e2ece6] z-50 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16">
          {NAV_ITEMS.map((item) =>
            item.path === '' ? (
              <button
                key="more"
                onClick={() => setMoreOpen(true)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${moreOpen ? 'text-emerald-600' : 'text-[#8fa898]'}`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
              </button>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${isActive ? 'text-emerald-600' : 'text-[#8fa898]'}`
                }
              >
                {item.icon}
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
              </NavLink>
            )
          )}
        </div>
      </nav>

      {/* もっとメニュー（ドロワー） */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            {/* ドロワーハンドル */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <p className="text-sm font-bold text-[#1f2d27]">メニュー</p>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="メニューを閉じる"
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              {MORE_ITEMS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMoreOpen(false) }}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all duration-150 text-center
                    ${location.pathname === item.path
                      ? 'bg-emerald-50 ring-1 ring-emerald-200'
                      : 'bg-[#f6faf7] hover:bg-emerald-50 active:scale-95'}`}
                >
                  {item.icon}
                  <span className="text-[11px] font-semibold text-[#1f2d27] leading-tight break-words w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const MobileHeader: React.FC<{ title: string; hasDemo?: boolean }> = ({ title, hasDemo }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isTop = location.pathname === '/dashboard'
  const [guideOpen, setGuideOpen] = useState(false)

  const handleBack = () => {
    if (window.history.length <= 1) {
      navigate('/dashboard')
    } else {
      navigate(-1)
    }
  }

  return (
    <>
      <header
        className={`md:hidden sticky z-50 bg-white/95 backdrop-blur-sm border-b border-[#e2ece6] shadow-[0_1px_8px_rgba(0,0,0,0.04)] ${hasDemo ? 'top-8' : 'top-0'}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="h-14 flex items-center px-4 gap-2">
          {!isTop && (
            <button
              onClick={handleBack}
              aria-label="戻る"
              className="p-2 -ml-2 text-[#6b7e74] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {isTop && (
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <ShieldCheck size={15} className="text-white" />
            </div>
          )}
          <h1 className="text-[15px] font-bold text-[#1f2d27] break-anywhere truncate flex-1 ml-1">
            {title}
          </h1>
          <button
            onClick={() => setGuideOpen(true)}
            aria-label="操作ガイドを開く"
            className="p-2 text-[#8fa898] hover:text-emerald-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-emerald-50"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>
      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard':           '今月の安全管理',
    '/plans':               '年間安全カレンダー',
    '/checklists/monthly':  '月次チェック表',
    '/checklists/seasonal': '季節前チェック表',
    '/near-miss':           'ヒヤリハット改善ノート',
    '/materials/staff':     '職員共有シート',
    '/materials/guardian':  '保護者周知文',
    '/records':             '実施記録・証跡',
    '/reports':             '報告書',
    '/reports/new':         '報告書を作成',
    '/emergency':           '緊急対応カード',
    '/nap':                 '午睡見守り記録',
    '/training':            '職員研修・資格管理',
    '/photos':              '写真管理',
    '/photos/upload':       '写真をアップロード',
    '/photos/gallery':      '写真ギャラリー',
    '/children':            '園児管理',
    '/settings':            '設定',
  }
  if (map[pathname]) return map[pathname]
  if (pathname.startsWith('/reports/')) return '報告書エディタ'
  return 'まもりすと'
}

const DemoBanner: React.FC = () => {
  const navigate = useNavigate()

  const handleExit = () => {
    clearDemoData()
    navigate('/setup')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-400 text-amber-900 flex items-center justify-between px-4 py-1.5 text-xs font-semibold shadow-sm">
      <span>🎮 デモモード中 — 入力データは保存されません</span>
      <button
        onClick={handleExit}
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors text-xs font-semibold"
      >
        <LogOut size={12} />
        終了
      </button>
    </div>
  )
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const title = getPageTitle(location.pathname)
  const isSetup = location.pathname === '/setup'
  const isDemo = useFacilityStore((s) => s.isDemo)

  if (isSetup) {
    return <>{children}</>
  }

  return (
    <div className={`min-h-dvh w-full overflow-x-hidden bg-[#f6faf7] ${isDemo ? 'pt-8' : ''}`}>
      {isDemo && <DemoBanner />}
      <Sidebar />
      <MobileHeader title={title} hasDemo={isDemo} />
      <main className="main-content">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

export default AppLayout
