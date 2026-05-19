import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Facility } from '@/types'

interface FacilityState {
  facility: Facility | null
  isDemo: boolean
  trialExpiresAt: string | null  // ISO string。null = 無制限（既存施設の互換性維持）
  facilityToken: string | null   // Supabase JWT（RLS 施設単位アクセス制御用）
  setFacility: (f: Facility) => void
  clearFacility: () => void
  setIsDemo: (v: boolean) => void
  setTrialExpiresAt: (v: string | null) => void
  setFacilityToken: (token: string | null) => void
}

export const useFacilityStore = create<FacilityState>()(
  persist(
    (set) => ({
      facility: null,
      isDemo: false,
      trialExpiresAt: null,
      facilityToken: null,
      setFacility: (f) => set({ facility: f }),
      clearFacility: () => set({ facility: null, isDemo: false, trialExpiresAt: null, facilityToken: null }),
      setIsDemo: (v) => set({ isDemo: v }),
      setTrialExpiresAt: (v) => set({ trialExpiresAt: v }),
      setFacilityToken: (token) => set({ facilityToken: token }),
    }),
    { name: 'facility-store' }
  )
)
