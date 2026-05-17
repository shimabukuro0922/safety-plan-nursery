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
  { label: 'ホーム',   path: '/dashboard',         icon: <LayoutDashboard size={20} /> },
  { label: 'チェック', path: '/checklists/monthly', icon: <ClipboardCheck size={20} /> },
  { label: '写真',     path: '/photos',             icon: <Camera size={20} /> },
  { label: '午睡',     path: '/nap',                icon: <Moon size={20} /> },
  { label: 'もっと',   path: '',                    icon: <MoreHorizontal size={20} /> },
]

const MORE_ITEMS = [
  { label: '園児管理',           path: '/children',  icon: <Users size={20} className="text-indigo-500" /> },
  { label: 'ヒヤリハット',       path: '/near-miss', icon: <AlertCircle size={20} className="text-orange-500" /> },
  { label: '緊急対応カード',     path: '/emergency', icon: <Siren size={20} className="text-red-500" /> },
  { label: '職員研修・資格管理', path: '/training',  icon: <GraduationCap size={20} className="text-purple-500" /> },
  { label: '実施記録・証跡',     path: '/records',   icon: <History size={20} className="text-blue-500" /> },
  { label: '報告書',             path: '/reports',   icon: <FileText size={20} className="text-gray-500" /> },
  { label: '年間カレンダー',     path: '/plans',     icon: <CalendarDays size={20} className="text-green-500" /> },
  { label: '季節前チェック',     path: '/checklists/seasonal', icon: <ClipboardCheck size={20} className="text-teal-500" /> },
  { label: '職員共有シート',     path: '/materials/staff',    icon: <Users size={20} className="text-orange-500" /> },
  { label: '保護者周知文',       path: '/materials/guardian', icon: <Bell size={20} className="text-pink-500" /> },
  { label: '設定',               path: '/settings',  icon: <Settings size={20} className="text-gray-500" /> },
]

const PC_NAV_ITEMS = [
  {
    section: '毎月の運用',
    items: [
      { label: 'ホーム（今月やること）', path: '/dashboard',          icon: <LayoutDashboard size={16} /> },
      { label: '月次チェック表',         path: '/checklists/monthly', icon: <ClipboardCheck size={16} /> },
      { label: 'ヒヤリハット改善ノート', path: '/near-miss',          icon: <AlertCircle size={16} /> },
    ],
  },
  {
    section: '年間計画',
    items: [
      { label: '年間安全カレンダー', path: '/plans',                 icon: <CalendarDays size={16} /> },
      { label: '季節前チェック',     path: '/checklists/seasonal',   icon: <ClipboardCheck size={16} /> },
    ],
  },
  {
    section: '共有・周知',
    items: [
      { label: '職員共有シート',   path: '/materials/staff',     icon: <Users size={16} /> },
      { label: '保護者周知文',     path: '/materials/guardian',  icon: <Bell size={16} /> },
    ],
  },
  {
    section: '記録・報告',
    items: [
      { label: '実施記録・証跡', path: '/records',  icon: <History size={16} /> },
      { label: '報告書',         path: '/reports',  icon: <FileText size={16} /> },
    ],
  },
  {
    section: '写真管理',
    items: [
      { label: '写真管理',     path: '/photos',         icon: <Camera size={16} /> },
      { label: '園児管理',     path: '/children',       icon: <Users size={16} /> },
    ],
  },
  {
    section: '現場サポート',
    items: [
      { label: '緊急対応カード',       path: '/emergency', icon: <Siren size={16} /> },
      { label: '午睡見守り記録',       path: '/nap',       icon: <Moon size={16} /> },
      { label: '職員研修・資格管理',   path: '/training',  icon: <GraduationCap size={16} /> },
    ],
  },
  {
    section: '管理',
    items: [
      { label: '設定', path: '/settings', icon: <Settings size={16} /> },
    ],
  },
]

const Sidebar: React.FC = () => {
  const [guideOpen, setGuideOpen] = useState(false)
  return (
  <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-200 z-40 overflow-y-auto">
    <div className="px-5 py-5 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-900 leading-tight">安全計画 使える化</p>
          <p className="text-xs text-gray-500 leading-tight">園長の安全管理サポート</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 px-3 py-4 space-y-5">
      {PC_NAV_ITEMS.map((group) => (
        <div key={group.section}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
            {group.section}
          </p>
          {group.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

    <div className="px-5 py-4 border-t border-gray-100 space-y-2">
      <button
        onClick={() => setGuideOpen(true)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors w-full"
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
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16">
          {NAV_ITEMS.map((item) =>
            item.path === '' ? (
              <button
                key="more"
                onClick={() => setMoreOpen(true)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors
                  ${moreOpen ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors
                  ${isActive ? 'text-blue-600' : 'text-gray-400'}`
                }
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            )
          )}
        </div>
      </nav>

      {/* もっとメニュー（ドロワー） */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          {/* ドロワー本体 */}
          <div
            className="relative bg-white rounded-t-2xl shadow-xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm font-bold text-gray-800">メニュー</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-3 pb-4 grid grid-cols-3 gap-1">
              {MORE_ITEMS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMoreOpen(false) }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors text-center
                    ${location.pathname === item.path ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  {item.icon}
                  <span className="text-[11px] font-medium text-gray-700 leading-tight break-words w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const MobileHeader: React.FC<{ title: string }> = ({ title }) => {
  const location = useLocation()
  const isTop = location.pathname === '/dashboard'
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <>
      <header
        className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="h-14 flex items-center px-4 gap-2">
          {!isTop && (
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 text-gray-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {isTop && (
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
          )}
          <h1 className="text-base font-bold text-gray-900 break-anywhere truncate flex-1">
            {title}
          </h1>
          <button
            onClick={() => setGuideOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
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
  return '安全計画 使える化'
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
    <div className={`min-h-dvh w-full overflow-x-hidden bg-gray-50 ${isDemo ? 'pt-8' : ''}`}>
      {isDemo && <DemoBanner />}
      <Sidebar />
      <MobileHeader title={title} />
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
