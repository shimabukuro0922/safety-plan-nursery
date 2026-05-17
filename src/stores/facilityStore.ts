import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Facility } from '@/types'

interface FacilityState {
  facility: Facility | null
  isDemo: boolean
  trialExpiresAt: string | null  // ISO string。null = 無制限（既存施設の互換性維持）
  setFacility: (f: Facility) => void
  clearFacility: () => void
  setIsDemo: (v: boolean) => void
  setTrialExpiresAt: (v: string | null) => void
}

export const useFacilityStore = create<FacilityState>()(
  persist(
    (set) => ({
      facility: null,
      isDemo: false,
      trialExpiresAt: null,
      setFacility: (f) => set({ facility: f }),
      clearFacility: () => set({ facility: null, isDemo: false, trialExpiresAt: null }),
      setIsDemo: (v) => set({ isDemo: v }),
      setTrialExpiresAt: (v) => set({ trialExpiresAt: v }),
    }),
    { name: 'facility-store' }
  )
)
