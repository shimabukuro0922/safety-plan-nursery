import React, { Suspense, useEffect } from 'react'

// ==============================
// エラーバウンダリ
// ==============================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-lg font-bold text-gray-800 mb-2">エラーが発生しました</p>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            ページを再読み込みして再試行してください。<br />
            問題が続く場合はブラウザのキャッシュをクリアしてください。
          </p>
          <button
            onClick={() => location.reload()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import { SyncProvider } from '@/components/SyncProvider'
import { PINGate } from '@/components/PINGate'
import { LoadingSpinner } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { ChatBot } from '@/components/ChatBot'
import { loadDemoData } from '@/lib/demo'

const Setup = React.lazy(() => import('@/pages/Setup'))
const Dashboard = React.lazy(() => import('@/pages/Dashboard'))
const MonthlyChecklist = React.lazy(() => import('@/pages/checklists/MonthlyChecklist'))
const SeasonalChecklist = React.lazy(() => import('@/pages/checklists/SeasonalChecklist'))
const Plans = React.lazy(() => import('@/pages/plans/Plans'))
const ReportList = React.lazy(() => import('@/pages/reports/ReportList'))
const ReportCreate = React.lazy(() => import('@/pages/reports/ReportCreate'))
const ReportEditPage = React.lazy(() => import('@/pages/reports/ReportEditPage'))
const RecordList = React.lazy(() => import('@/pages/records/RecordList'))
const StaffMaterial = React.lazy(() => import('@/pages/materials/StaffMaterial'))
const GuardianNotice = React.lazy(() => import('@/pages/materials/GuardianNotice'))
const Settings = React.lazy(() => import('@/pages/settings/Settings'))
const NearMiss = React.lazy(() => import('@/pages/near-miss/NearMiss'))
const EmergencyGuide = React.lazy(() => import('@/pages/emergency/EmergencyGuide'))
const NapCheck = React.lazy(() => import('@/pages/nap/NapCheck'))
const StaffTraining = React.lazy(() => import('@/pages/training/StaffTraining'))
const PhotoHub = React.lazy(() => import('@/pages/photos/PhotoHub'))
const PhotoUpload = React.lazy(() => import('@/pages/photos/PhotoUpload'))
const PhotoGallery = React.lazy(() => import('@/pages/photos/PhotoGallery'))
const ChildrenManager = React.lazy(() => import('@/pages/children/ChildrenManager'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
})

// トライアル期限切れ画面
const TrialExpiredScreen: React.FC = () => (
  <div className="min-h-dvh flex flex-col items-center justify-center px-5 text-center bg-white">
    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <span className="text-3xl">⏰</span>
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-2">トライアル期間が終了しました</h2>
    <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-xs">
      30日間のトライアルをご利用いただきありがとうございました。<br />
      引き続きご利用いただくには、お申し込みが必要です。
    </p>
    <a
      href="https://docs.google.com/forms/d/e/1FAIpQLSdTO95TmeXWXtNbk7EqbyqJpJAJbYM27cVjZTHTxY_Rn-9Xkw/viewform"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
    >
      継続利用を申し込む
    </a>
    <p className="mt-4 text-xs text-gray-400">
      お問い合わせ：ys.ehon1@gmail.com
    </p>
  </div>
)

// 施設未登録の場合は /setup へリダイレクト。トライアル期限切れの場合は期限切れ画面を表示
const RequireSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { facility, isDemo, trialExpiresAt } = useFacilityStore()
  if (!facility) return <Navigate to="/setup" replace />
  if (!isDemo && trialExpiresAt && new Date(trialExpiresAt) < new Date()) {
    return <TrialExpiredScreen />
  }
  return <>{children}</>
}

function AppRoutes() {
  // アプリ起動時にデモモードが残っていたら常にフレッシュなデモデータにリセット
  // （前回のデモ利用者のデータが残らないようにする）
  useEffect(() => {
    const isDemo = useFacilityStore.getState().isDemo
    if (isDemo) {
      loadDemoData()
    }
  }, [])

  return (
    <Suspense fallback={<div className="px-4 py-10"><LoadingSpinner /></div>}>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireSetup><Dashboard /></RequireSetup>} />
        <Route path="/plans" element={<RequireSetup><Plans /></RequireSetup>} />
        <Route path="/checklists/monthly" element={<RequireSetup><MonthlyChecklist /></RequireSetup>} />
        <Route path="/checklists/seasonal" element={<RequireSetup><SeasonalChecklist /></RequireSetup>} />
        <Route path="/materials/staff" element={<RequireSetup><StaffMaterial /></RequireSetup>} />
        <Route path="/materials/guardian" element={<RequireSetup><GuardianNotice /></RequireSetup>} />
        <Route path="/records" element={<RequireSetup><RecordList /></RequireSetup>} />
        <Route path="/reports" element={<RequireSetup><ReportList /></RequireSetup>} />
        <Route path="/reports/new" element={<RequireSetup><ReportCreate /></RequireSetup>} />
        <Route path="/reports/:id" element={<RequireSetup><ReportEditPage /></RequireSetup>} />
        <Route path="/near-miss" element={<RequireSetup><NearMiss /></RequireSetup>} />
        <Route path="/emergency" element={<RequireSetup><EmergencyGuide /></RequireSetup>} />
        <Route path="/nap" element={<RequireSetup><NapCheck /></RequireSetup>} />
        <Route path="/training" element={<RequireSetup><StaffTraining /></RequireSetup>} />
        <Route path="/photos" element={<RequireSetup><PhotoHub /></RequireSetup>} />
        <Route path="/photos/upload" element={<RequireSetup><PhotoUpload /></RequireSetup>} />
        <Route path="/photos/gallery" element={<RequireSetup><PhotoGallery /></RequireSetup>} />
        <Route path="/children" element={<RequireSetup><ChildrenManager /></RequireSetup>} />
        <Route path="/settings" element={<RequireSetup><Settings /></RequireSetup>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SyncProvider>
            <PINGate>
              <AppLayout>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </AppLayout>
              <ChatBot />
            </PINGate>
          </SyncProvider>
        </BrowserRouter>
      </QueryClientProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px', maxWidth: '360px' },
        }}
      />
    </ErrorBoundary>
  )
}

export default App
