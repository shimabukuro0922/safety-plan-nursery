import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import { SyncProvider } from '@/components/SyncProvider'
import { LoadingSpinner } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'

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

// 施設未登録の場合は /setup へリダイレクト
const RequireSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { facility } = useFacilityStore()
  if (!facility) return <Navigate to="/setup" replace />
  return <>{children}</>
}

function AppRoutes() {
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SyncProvider>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </SyncProvider>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px', maxWidth: '360px' },
        }}
      />
    </QueryClientProvider>
  )
}

export default App
