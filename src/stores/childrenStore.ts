import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useFacilityStore } from '@/stores/facilityStore'
import { pushChild as syncPushChild, deleteChildRemote } from '@/lib/sync'

function getSupabaseId(): string | null {
  return useFacilityStore.getState().facility?.supabaseId ?? null
}

export const DEFAULT_CLASSES = [
  '0歳児クラス',
  '1歳児クラス',
  '2歳児クラス',
  '3歳児クラス（年少）',
  '4歳児クラス（年中）',
  '5歳児クラス（年長）',
]

export interface Child {
  id: string
  name: string
  className: string
  isPhotoNG: boolean
  ngReason: string | null
  createdAt: string
}

interface ChildrenState {
  children: Child[]
  classes: string[]
  addClass: (name: string) => void
  addChild: (data: Omit<Child, 'id' | 'createdAt'>) => string
  updateChild: (id: string, updates: Partial<Omit<Child, 'id' | 'createdAt'>>) => void
  deleteChild: (id: string) => void
  setPhotoNG: (id: string, isNG: boolean, reason?: string) => void
}

export const useChildrenStore = create<ChildrenState>()(
  persist(
    (set) => ({
      children: [],
      classes: DEFAULT_CLASSES,
      addClass: (name) =>
        set((state) => ({
          classes: state.classes.includes(name) ? state.classes : [...state.classes, name],
        })),
      addChild: (data) => {
        const id = `child_${Date.now()}`
        const child = { ...data, id, createdAt: new Date().toISOString() }
        set((state) => ({ children: [...state.children, child] }))
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushChild(child, supabaseId).catch(console.error)
        return id
      },
      updateChild: (id, updates) => {
        set((state) => ({
          children: state.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = useChildrenStore.getState().children.find((c) => c.id === id)
          if (updated) syncPushChild({ ...updated, ...updates }, supabaseId).catch(console.error)
        }
      },
      deleteChild: (id) => {
        const supabaseId = getSupabaseId()
        set((state) => ({ children: state.children.filter((c) => c.id !== id) }))
        if (supabaseId) deleteChildRemote(id, supabaseId).catch(console.error)
      },
      setPhotoNG: (id, isNG, reason) => {
        set((state) => ({
          children: state.children.map((c) =>
            c.id === id
              ? { ...c, isPhotoNG: isNG, ngReason: isNG ? (reason ?? '保護者申請') : null }
              : c
          ),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = useChildrenStore.getState().children.find((c) => c.id === id)
          if (updated) syncPushChild(updated, supabaseId).catch(console.error)
        }
      },
    }),
    { name: 'children-store-v1' }
  )
)
