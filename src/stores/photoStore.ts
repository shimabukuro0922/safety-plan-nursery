import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PhotoEvent {
  id: string
  name: string
  date: string
  className: string   // '' = 全クラス共通
  notes: string
  createdAt: string
}

export type PhotoStatus = 'pending' | 'approved' | 'rejected'

export interface PhotoMeta {
  id: string
  eventId: string
  filename: string
  takenAt: string
  taggedChildIds: string[]
  hasNGChild: boolean
  status: PhotoStatus
  rejectedReason: string | null
  thumbnailDataUrl: string    // base64 300px thumbnail — fast preview without IndexedDB
  uploadedAt: string
}

interface PhotoState {
  events: PhotoEvent[]
  photos: PhotoMeta[]
  addEvent: (data: Omit<PhotoEvent, 'id' | 'createdAt'>) => string
  updateEvent: (id: string, updates: Partial<Omit<PhotoEvent, 'id' | 'createdAt'>>) => void
  deleteEvent: (id: string) => void
  addPhoto: (data: Omit<PhotoMeta, 'id' | 'uploadedAt'>) => string
  updatePhoto: (id: string, updates: Partial<PhotoMeta>) => void
  deletePhoto: (id: string) => void
  approvePhoto: (id: string) => void
  rejectPhoto: (id: string, reason?: string) => void
  resetToPending: (id: string) => void
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set) => ({
      events: [],
      photos: [],

      addEvent: (data) => {
        const id = `ev_${Date.now()}`
        set((state) => ({
          events: [{ ...data, id, createdAt: new Date().toISOString() }, ...state.events],
        }))
        return id
      },
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          photos: state.photos.filter((p) => p.eventId !== id),
        })),

      addPhoto: (data) => {
        const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        set((state) => ({
          photos: [{ ...data, id, uploadedAt: new Date().toISOString() }, ...state.photos],
        }))
        return id
      },
      updatePhoto: (id, updates) =>
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePhoto: (id) =>
        set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),

      approvePhoto: (id) =>
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, status: 'approved', rejectedReason: null } : p
          ),
        })),
      rejectPhoto: (id, reason) =>
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, status: 'rejected', rejectedReason: reason ?? null } : p
          ),
        })),
      resetToPending: (id) =>
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, status: 'pending', rejectedReason: null } : p
          ),
        })),
    }),
    { name: 'photo-store-v1' }
  )
)
