import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NearMiss, NearMissStep, NearMissScene, ChecklistItem } from '@/types'

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
  doneItems: Record<string, { done_at: string; done_by: string; notes: string | null }>
  markDone: (itemId: string, done_by: string, notes?: string) => void
  markUndone: (itemId: string) => void
  isDone: (itemId: string) => boolean
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      doneItems: {},
      markDone: (itemId, done_by, notes = null) => {
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
