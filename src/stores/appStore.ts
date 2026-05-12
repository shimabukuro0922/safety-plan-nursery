import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NearMiss, NearMissStep, NearMissScene, Report, ReportContent, ReportStatus, ReportType, ReportStyle } from '@/types'

// ==============================
// ヒヤリハット
// ==============================
interface NearMissState {
  nearMisses: NearMiss[]
  addNearMiss: (data: { scene: NearMissScene; what_happened: string; created_by: string }) => void
  updateNearMiss: (id: string, updates: Partial<NearMiss>) => void
  advanceStep: (id: string) => void
  deleteNearMiss: (id: string) => void
}

const STEP_ORDER: NearMissStep[] = ['occurred', 'cause', 'action', 'shared', 'recheck']

export const useNearMissStore = create<NearMissState>()(
  persist(
    (set) => ({
      nearMisses: [],
      addNearMiss: ({ scene, what_happened, created_by }) => {
        const newItem: NearMiss = {
          id: `nm_${Date.now()}`,
          facility_id: 'local',
          occurred_at: new Date().toISOString().split('T')[0],
          scene,
          what_happened,
          why_it_happened: null,
          what_to_change: null,
          shared_with: null,
          recheck_date: null,
          step: 'occurred',
          created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({ nearMisses: [newItem, ...state.nearMisses] }))
      },
      updateNearMiss: (id, updates) => {
        set((state) => ({
          nearMisses: state.nearMisses.map((nm) =>
            nm.id === id
              ? { ...nm, ...updates, updated_at: new Date().toISOString() }
              : nm
          ),
        }))
      },
      advanceStep: (id) => {
        set((state) => ({
          nearMisses: state.nearMisses.map((nm) => {
            if (nm.id !== id) return nm
            const idx = STEP_ORDER.indexOf(nm.step)
            const nextStep = STEP_ORDER[idx + 1] ?? nm.step
            return { ...nm, step: nextStep, updated_at: new Date().toISOString() }
          }),
        }))
      },
      deleteNearMiss: (id) => {
        set((state) => ({
          nearMisses: state.nearMisses.filter((nm) => nm.id !== id),
        }))
      },
    }),
    { name: 'near-miss-store' }
  )
)

// ==============================
// チェックリスト（月次）
// ==============================
interface ChecklistState {
  doneItems: Record<string, { done_at: string; done_by: string; notes?: string }>
  markDone: (itemId: string, done_by: string, notes?: string) => void
  markUndone: (itemId: string) => void
  isDone: (itemId: string) => boolean
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      doneItems: {},
      markDone: (itemId, done_by, notes = undefined) => {
        set((state) => ({
          doneItems: {
            ...state.doneItems,
            [itemId]: {
              done_at: new Date().toISOString(),
              done_by,
              notes,
            },
          },
        }))
      },
      markUndone: (itemId) => {
        set((state) => {
          const { [itemId]: _, ...rest } = state.doneItems
          return { doneItems: rest }
        })
      },
      isDone: (itemId) => {
        return itemId in get().doneItems
      },
    }),
    { name: 'checklist-store' }
  )
)

// ==============================
// 季節前チェックリスト
// ==============================
interface SeasonalChecklistState {
  doneItems: Record<string, { done_at: string; done_by: string }>
  markDone: (itemKey: string, done_by: string) => void
  markUndone: (itemKey: string) => void
  isDone: (itemKey: string) => boolean
}

export const useSeasonalChecklistStore = create<SeasonalChecklistState>()(
  persist(
    (set, get) => ({
      doneItems: {},
      markDone: (itemKey, done_by) => {
        set((state) => ({
          doneItems: {
            ...state.doneItems,
            [itemKey]: { done_at: new Date().toISOString(), done_by },
          },
        }))
      },
      markUndone: (itemKey) => {
        set((state) => {
          const { [itemKey]: _, ...rest } = state.doneItems
          return { doneItems: rest }
        })
      },
      isDone: (itemKey) => itemKey in get().doneItems,
    }),
    { name: 'seasonal-checklist-store' }
  )
)

// ==============================
// 報告書
// ==============================
export interface StoredReport extends Report {
  content: ReportContent
}

interface ReportState {
  reports: StoredReport[]
  addReport: (data: { title: string; report_type: ReportType; style: ReportStyle; created_by: string }) => string
  updateReportStatus: (id: string, status: ReportStatus) => void
  updateReportContent: (id: string, content: ReportContent) => void
  deleteReport: (id: string) => void
}

const makeInitialContent = (title: string): ReportContent => ({
  title,
  sections: [
    { id: 's1', title: '実施概要', body: '', ai_generated: false, last_edited_by: 'human' },
    { id: 's2', title: '実施済み項目', body: '', ai_generated: false, last_edited_by: 'human' },
    { id: 's3', title: '未実施項目と対応方針', body: '', ai_generated: false, last_edited_by: 'human' },
    { id: 's4', title: '次月の重点取り組み', body: '', ai_generated: false, last_edited_by: 'human' },
  ],
  missing_info: [],
  suggestions: [],
})

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      reports: [],
      addReport: ({ title, report_type, style, created_by }) => {
        const id = `rpt_${Date.now()}`
        const newReport: StoredReport = {
          id,
          facility_id: 'local',
          title,
          report_type,
          style,
          status: 'draft',
          current_version: 1,
          approved_by: null,
          approved_at: null,
          created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          content: makeInitialContent(title),
        }
        set((state) => ({ reports: [newReport, ...state.reports] }))
        return id
      },
      updateReportStatus: (id, status) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r
          ),
        }))
      },
      updateReportContent: (id, content) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id
              ? { ...r, content, current_version: r.current_version + 1, updated_at: new Date().toISOString() }
              : r
          ),
        }))
      },
      deleteReport: (id) => {
        set((state) => ({ reports: state.reports.filter((r) => r.id !== id) }))
      },
    }),
    { name: 'report-store' }
  )
)
