import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        set((state) => ({
          children: [...state.children, { ...data, id, createdAt: new Date().toISOString() }],
        }))
        return id
      },
      updateChild: (id, updates) =>
        set((state) => ({
          children: state.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteChild: (id) =>
        set((state) => ({ children: state.children.filter((c) => c.id !== id) })),
      setPhotoNG: (id, isNG, reason) =>
        set((state) => ({
          children: state.children.map((c) =>
            c.id === id
              ? { ...c, isPhotoNG: isNG, ngReason: isNG ? (reason ?? '保護者申請') : null }
              : c
          ),
        })),
    }),
    { name: 'children-store-v1' }
  )
)
