import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deletePhoto as deletePhotoDB } from '@/lib/photoDB'
import { useFacilityStore } from '@/stores/facilityStore'
import {
  pushPhotoEvent,
  deletePhotoEventRemote,
  deletePhotoMetaByEventRemote,
  pushPhotoMeta,
  deletePhotoMetaRemote,
} from '@/lib/sync'

function getSupabaseId(): string | null {
  return useFacilityStore.getState().facility?.supabaseId ?? null
}

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
  storageUrl?: string | null  // Supabase Storage の公開URL（設定済みの場合）
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
    (set, get) => ({
      events: [],
      photos: [],

      addEvent: (data) => {
        const id = `ev_${Date.now()}`
        const event: PhotoEvent = { ...data, id, createdAt: new Date().toISOString() }
        set((state) => ({ events: [event, ...state.events] }))
        const supabaseId = getSupabaseId()
        if (supabaseId) pushPhotoEvent(event, supabaseId).catch(console.error)
        return id
      },
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = get().events.find((e) => e.id === id)
          if (updated) pushPhotoEvent(updated, supabaseId).catch(console.error)
        }
      },
      deleteEvent: (id) => {
        // 紐づく写真のIndexedDB blobとリモートメタを削除
        get().photos.filter((p) => p.eventId === id).forEach((p) => deletePhotoDB(p.id).catch(console.error))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          deletePhotoMetaByEventRemote(id, supabaseId).catch(console.error)
          deletePhotoEventRemote(id, supabaseId).catch(console.error)
        }
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          photos: state.photos.filter((p) => p.eventId !== id),
        }))
      },

      addPhoto: (data) => {
        const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const photo: PhotoMeta = { ...data, id, uploadedAt: new Date().toISOString() }
        set((state) => ({ photos: [photo, ...state.photos] }))
        const supabaseId = getSupabaseId()
        if (supabaseId) pushPhotoMeta(
          { ...photo, storageUrl: photo.storageUrl ?? null },
          supabaseId
        ).catch(console.error)
        return id
      },
      updatePhoto: (id, updates) => {
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = get().photos.find((p) => p.id === id)
          if (updated) pushPhotoMeta(
            { ...updated, storageUrl: updated.storageUrl ?? null },
            supabaseId
          ).catch(console.error)
        }
      },
      deletePhoto: (id) => {
        // IndexedDB blobとリモートメタを削除
        deletePhotoDB(id).catch(console.error)
        const supabaseId = getSupabaseId()
        if (supabaseId) deletePhotoMetaRemote(id, supabaseId).catch(console.error)
        set((state) => ({ photos: state.photos.filter((p) => p.id !== id) }))
      },

      approvePhoto: (id) => {
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, status: 'approved', rejectedReason: null } : p
          ),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = get().photos.find((p) => p.id === id)
          if (updated) pushPhotoMeta(
            { ...updated, storageUrl: updated.storageUrl ?? null },
            supabaseId
          ).catch(console.error)
        }
      },
      rejectPhoto: (id, reason) => {
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, status: 'rejected', rejectedReason: reason ?? null } : p
          ),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = get().photos.find((p) => p.id === id)
          if (updated) pushPhotoMeta(
            { ...updated, storageUrl: updated.storageUrl ?? null },
            supabaseId
          ).catch(console.error)
        }
      },
      resetToPending: (id) => {
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, status: 'pending', rejectedReason: null } : p
          ),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = get().photos.find((p) => p.id === id)
          if (updated) pushPhotoMeta(
            { ...updated, storageUrl: updated.storageUrl ?? null },
            supabaseId
          ).catch(console.error)
        }
      },
    }),
    { name: 'photo-store-v1' }
  )
)
