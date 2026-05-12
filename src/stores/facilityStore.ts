import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Facility } from '@/types'

interface FacilityState {
  facility: Facility | null
  setFacility: (f: Facility) => void
  clearFacility: () => void
}

export const useFacilityStore = create<FacilityState>()(
  persist(
    (set) => ({
      facility: null,
      setFacility: (f) => set({ facility: f }),
      clearFacility: () => set({ facility: null }),
    }),
    { name: 'facility-store' }
  )
)
