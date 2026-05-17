import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NearMiss, NearMissStep, NearMissScene, Report, ReportContent, ReportStatus, ReportType, ReportStyle } from '@/types'
import { useFacilityStore } from '@/stores/facilityStore'
import {
  pushNearMiss as syncPushNearMiss,
  deleteNearMissRemote,
  pushNapCheck as syncPushNapCheck,
  pushTrainingRecord as syncPushTrainingRecord,
  deleteTrainingRecordRemote,
  pushChecklistDone as syncPushChecklistDone,
  pushChecklistItems as syncPushChecklistItems,
  deleteChecklistDoneItem,
  clearChecklistDoneRemote,
  clearNapChecksForDateRemote,
  pushSeasonalDone,
  deleteSeasonalDoneItem,
  pushAnnualPlanMonth,
  pushAnnualPlans,
} from '@/lib/sync'

/** 施設の Supabase ID を取得するヘルパ */
function getSupabaseId(): string | null {
  return useFacilityStore.getState().facility?.supabaseId ?? null
}

// ==============================
// ヒヤリハット
// ==============================
interface NearMissState {
  nearMisses: NearMiss[]
  addNearMiss: (data: { scene: NearMissScene; location?: string | null; what_happened: string; created_by: string }) => void
  updateNearMiss: (id: string, updates: Partial<NearMiss>) => void
  advanceStep: (id: string) => void
  deleteNearMiss: (id: string) => void
}

const STEP_ORDER: NearMissStep[] = ['occurred', 'cause', 'action', 'shared', 'recheck']

export const useNearMissStore = create<NearMissState>()(
  persist(
    (set) => ({
      nearMisses: [],
      addNearMiss: ({ scene, location = null, what_happened, created_by }: { scene: NearMissScene; location?: string | null; what_happened: string; created_by: string }) => {
        const supabaseId = getSupabaseId()
        const newItem: NearMiss = {
          id: `nm_${Date.now()}`,
          facility_id: supabaseId ?? 'local',
          occurred_at: new Date().toISOString().split('T')[0],
          scene,
          location,
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
        if (supabaseId) syncPushNearMiss(newItem, supabaseId).catch(console.error)
      },
      updateNearMiss: (id, updates) => {
        // set() を呼ぶ前に merged を構築してレースコンディションを回避
        const existing = useNearMissStore.getState().nearMisses.find((nm) => nm.id === id)
        const merged = existing ? { ...existing, ...updates, updated_at: new Date().toISOString() } : null
        set((state) => ({
          nearMisses: state.nearMisses.map((nm) =>
            nm.id === id ? (merged ?? { ...nm, ...updates, updated_at: new Date().toISOString() }) : nm
          ),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId && merged) syncPushNearMiss(merged, supabaseId).catch(console.error)
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
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const updated = useNearMissStore.getState().nearMisses.find((nm) => nm.id === id)
          if (updated) syncPushNearMiss(updated, supabaseId).catch(console.error)
        }
      },
      deleteNearMiss: (id) => {
        const supabaseId = getSupabaseId()
        set((state) => ({
          nearMisses: state.nearMisses.filter((nm) => nm.id !== id),
        }))
        if (supabaseId) deleteNearMissRemote(id, supabaseId).catch(console.error)
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
  lastMarkedMonth: string | null  // "YYYY-MM" 形式
  markDone: (itemId: string, done_by: string, notes?: string) => void
  markUndone: (itemId: string) => void
  isDone: (itemId: string) => boolean
  resetForNewMonth: () => void
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      doneItems: {},
      lastMarkedMonth: null,
      markDone: (itemId, done_by, notes = undefined) => {
        const monthKey = new Date().toISOString().slice(0, 7) // "YYYY-MM"
        set((state) => ({
          doneItems: {
            ...state.doneItems,
            [itemId]: {
              done_at: new Date().toISOString(),
              done_by,
              notes,
            },
          },
          lastMarkedMonth: monthKey,
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) {
          const { doneItems, lastMarkedMonth } = useChecklistStore.getState()
          syncPushChecklistDone(doneItems, supabaseId, lastMarkedMonth).catch(console.error)
        }
      },
      markUndone: (itemId) => {
        set((state) => {
          const { [itemId]: _, ...rest } = state.doneItems
          return { doneItems: rest }
        })
        const supabaseId = getSupabaseId()
        // チェックを外した項目をSupabaseから削除（他端末にも反映）
        if (supabaseId) deleteChecklistDoneItem(supabaseId, itemId).catch(console.error)
      },
      isDone: (itemId) => {
        return itemId in get().doneItems
      },
      resetForNewMonth: () => {
        const monthKey = new Date().toISOString().slice(0, 7)
        set({ doneItems: {}, lastMarkedMonth: monthKey })
        const supabaseId = getSupabaseId()
        // 月リセット時はSupabaseの実施済みを全件削除（他端末にも反映）
        if (supabaseId) clearChecklistDoneRemote(supabaseId).catch(console.error)
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
        const record = { done_at: new Date().toISOString(), done_by }
        set((state) => ({
          doneItems: { ...state.doneItems, [itemKey]: record },
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) pushSeasonalDone({ [itemKey]: record }, supabaseId).catch(console.error)
      },
      markUndone: (itemKey) => {
        set((state) => {
          const { [itemKey]: _, ...rest } = state.doneItems
          return { doneItems: rest }
        })
        const supabaseId = getSupabaseId()
        if (supabaseId) deleteSeasonalDoneItem(supabaseId, itemKey).catch(console.error)
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

// ==============================
// 月次チェック項目定義
// ==============================
export interface ChecklistItemDef {
  id: string
  categoryName: string
  title: string
  description: string
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { id: 'ci01', categoryName: '午睡',       title: '午睡中の呼吸確認（5分ごと）',       description: 'うつぶせ・横向きを仰向けに直し、顔色・胸の動きを確認する' },
  { id: 'ci02', categoryName: '午睡',       title: '午睡センサーの動作確認',             description: '電池残量・接続状態を確認する' },
  { id: 'ci03', categoryName: '食事・誤嚥', title: '食事中のアレルギー確認手順の実施',   description: '個別チェックシートと照合し、提供前に二重確認する' },
  { id: 'ci04', categoryName: '食事・誤嚥', title: '誤嚥対応訓練（年4回）の実施確認',   description: 'ハイムリック法・背部叩打法の確認' },
  { id: 'ci05', categoryName: 'AED・救急',  title: 'AEDの電源・パッド期限確認',         description: 'パッド使用期限・バッテリー残量を月次で確認する' },
  { id: 'ci06', categoryName: 'AED・救急',  title: '救急箱の補充・期限確認',             description: '消毒液・絆創膏・ガーゼ等の残量と使用期限を確認する' },
  { id: 'ci07', categoryName: '災害対応',   title: '避難経路・避難場所の掲示確認',       description: '各フロアの掲示物が見やすい場所にあることを確認する' },
  { id: 'ci08', categoryName: '職員研修',   title: '安全に関する職員朝礼実施',           description: '月1回、朝礼で安全確認事項を共有する' },
  { id: 'ci09', categoryName: '施設・設備', title: '施設内遊具・設備の安全点検',         description: '破損・腐食・ガタつきがないか確認する' },
  { id: 'ci10', categoryName: '保護者周知', title: '保護者への安全取組の周知',           description: '今月の安全活動内容を保護者に共有する' },
]

interface ChecklistItemsState {
  items: ChecklistItemDef[]
  addItem: (item: Omit<ChecklistItemDef, 'id'>) => void
  updateItem: (id: string, updates: Partial<Omit<ChecklistItemDef, 'id'>>) => void
  deleteItem: (id: string) => void
  resetToDefault: () => void
}

export const useChecklistItemsStore = create<ChecklistItemsState>()(
  persist(
    (set) => ({
      items: [],  // 新規ユーザーは空の状態からスタート
      addItem: (item) => {
        const id = `ci_${Date.now()}`
        set((state) => ({ items: [...state.items, { ...item, id }] }))
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushChecklistItems(useChecklistItemsStore.getState().items, supabaseId).catch(console.error)
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) => item.id === id ? { ...item, ...updates } : item),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushChecklistItems(useChecklistItemsStore.getState().items, supabaseId).catch(console.error)
      },
      deleteItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushChecklistItems(useChecklistItemsStore.getState().items, supabaseId).catch(console.error)
      },
      resetToDefault: () => {
        set({ items: DEFAULT_CHECKLIST_ITEMS })
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushChecklistItems(DEFAULT_CHECKLIST_ITEMS, supabaseId).catch(console.error)
      },
    }),
    {
      name: 'checklist-items-store-v3',
      // 既存ユーザーで items が空配列の場合はデフォルト項目を自動補完
      // merge を使うことで正しくストアに反映され再レンダリングもトリガーされる
      merge: (persisted, current) => {
        const p = persisted as Partial<ChecklistItemsState> | undefined
        return {
          ...current,
          ...p,
          items: Array.isArray(p?.items) ? p!.items : [],
        }
      },
    }
  )
)

// ==============================
// 年間安全カレンダー
// ==============================
export interface AnnualPlanMonth {
  month: number
  themes: string[]
  highRisk: string[]
}

const DEFAULT_ANNUAL_PLANS: AnnualPlanMonth[] = [
  { month: 4,  themes: ['安全計画 職員への周知・確認', '年度初め施設点検', '新入園児の安全オリエンテーション'], highRisk: ['午睡', '食事・アレルギー'] },
  { month: 5,  themes: ['園外活動ルート確認', '交通安全指導'], highRisk: ['園外活動・散歩', 'バス送迎'] },
  { month: 6,  themes: ['水遊び・熱中症対応の準備', 'プール開き前点検'], highRisk: ['水遊び・プール', '熱中症'] },
  { month: 7,  themes: ['プール・水遊び安全点検', '熱中症対策研修'], highRisk: ['水遊び・プール', '園庭活動'] },
  { month: 8,  themes: ['台風・災害対応の確認', 'バス送迎熱中症対策'], highRisk: ['バス送迎', '災害対応'] },
  { month: 9,  themes: ['引き渡し訓練', '防災訓練（地震・火災）'], highRisk: ['災害対応', '不審者対応'] },
  { month: 10, themes: ['不審者対応訓練', '園外活動の安全確認'], highRisk: ['不審者対応', '園外活動'] },
  { month: 11, themes: ['感染症・嘔吐処理研修', '冬季安全準備'], highRisk: ['感染症対応', '食事・誤嚥'] },
  { month: 12, themes: ['年末安全点検', '施設・設備の総確認'], highRisk: ['施設・設備全般'] },
  { month: 1,  themes: ['ヒヤリハット年間振り返り', '職員研修（前半まとめ）'], highRisk: ['午睡', '食事・アレルギー'] },
  { month: 2,  themes: ['次年度計画の準備・草案作成', '卒園前の安全確認'], highRisk: ['バス送迎', '施設点検'] },
  { month: 3,  themes: ['安全計画の年間見直し・評価', '次年度計画の承認・周知'], highRisk: ['年度末施設点検'] },
]

interface AnnualPlanState {
  plans: AnnualPlanMonth[]
  updateMonth: (month: number, themes: string[], highRisk: string[]) => void
  resetToDefault: () => void
}

const BLANK_ANNUAL_PLANS: AnnualPlanMonth[] = [1,2,3,4,5,6,7,8,9,10,11,12].map((m) => ({ month: m, themes: [], highRisk: [] }))

export const useAnnualPlanStore = create<AnnualPlanState>()(
  persist(
    (set) => ({
      plans: BLANK_ANNUAL_PLANS,
      updateMonth: (month, themes, highRisk) => {
        set((state) => ({
          plans: state.plans.map((p) => p.month === month ? { ...p, themes, highRisk } : p),
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) pushAnnualPlanMonth({ month, themes, highRisk }, supabaseId).catch(console.error)
      },
      resetToDefault: () => {
        set({ plans: DEFAULT_ANNUAL_PLANS })
        const supabaseId = getSupabaseId()
        if (supabaseId) pushAnnualPlans(DEFAULT_ANNUAL_PLANS, supabaseId).catch(console.error)
      },
    }),
    { name: 'annual-plan-store-v3' }
  )
)

// ==============================
// 季節前チェック項目定義
// ==============================
export interface SeasonalItemDef {
  key: string
  seasonKey: string
  label: string
}

const DEFAULT_SEASONAL_ITEMS: SeasonalItemDef[] = [
  { key: 'spring_pool',      seasonKey: 'spring', label: 'プール開き前点検' },
  { key: 'spring_trip',      seasonKey: 'spring', label: '春季遠足の安全確認' },
  { key: 'spring_new',       seasonKey: 'spring', label: '新入園児安全オリエンテーション' },
  { key: 'spring_equip',     seasonKey: 'spring', label: '園庭遊具の点検・整備' },
  { key: 'summer_pool',      seasonKey: 'summer', label: 'プール・水遊び安全確認' },
  { key: 'summer_heat',      seasonKey: 'summer', label: '熱中症対策確認（日陰・水分補給）' },
  { key: 'summer_aed',       seasonKey: 'summer', label: 'AED・救急備品チェック' },
  { key: 'summer_sunstroke', seasonKey: 'summer', label: '職員への熱中症対応研修' },
  { key: 'autumn_trip',      seasonKey: 'autumn', label: '秋季遠足の安全確認' },
  { key: 'autumn_drill',     seasonKey: 'autumn', label: '避難訓練実施' },
  { key: 'autumn_crime',     seasonKey: 'autumn', label: '防犯・不審者対応確認' },
  { key: 'autumn_equip',     seasonKey: 'autumn', label: '遊具・施設の秋季点検' },
  { key: 'winter_heat',      seasonKey: 'winter', label: '暖房器具安全点検' },
  { key: 'winter_infect',    seasonKey: 'winter', label: '感染症対策確認（インフルエンザ等）' },
  { key: 'winter_route',     seasonKey: 'winter', label: '避難経路の確認' },
  { key: 'winter_fire',      seasonKey: 'winter', label: '防火・火災避難訓練' },
]

interface SeasonalItemsState {
  items: SeasonalItemDef[]
  addItem: (seasonKey: string, label: string) => void
  updateItem: (key: string, label: string) => void
  deleteItem: (key: string) => void
  resetToDefault: () => void
}

export const useSeasonalItemsStore = create<SeasonalItemsState>()(
  persist(
    (set) => ({
      items: DEFAULT_SEASONAL_ITEMS,
      addItem: (seasonKey, label) => {
        const key = `${seasonKey}_custom_${Date.now()}`
        set((state) => ({ items: [...state.items, { key, seasonKey, label }] }))
      },
      updateItem: (key, label) => {
        set((state) => ({
          items: state.items.map((item) => item.key === key ? { ...item, label } : item),
        }))
      },
      deleteItem: (key) => {
        set((state) => ({ items: state.items.filter((item) => item.key !== key) }))
      },
      resetToDefault: () => set({ items: DEFAULT_SEASONAL_ITEMS }),
    }),
    {
      name: 'seasonal-items-store-v3',
      // 既存ユーザーで items が空配列の場合はデフォルト項目を自動補完
      merge: (persisted, current) => {
        const p = persisted as Partial<SeasonalItemsState> | undefined
        return {
          ...current,
          ...p,
          items: Array.isArray(p?.items) && p!.items.length > 0 ? p!.items : DEFAULT_SEASONAL_ITEMS,
        }
      },
    }
  )
)

// ==============================
// 保護者周知文カテゴリ
// ==============================
export interface NoticeCategoryDef {
  id: string
  name: string
  isDefault: boolean
}

const DEFAULT_NOTICE_CATEGORIES: NoticeCategoryDef[] = [
  { id: 'nap',        name: '午睡の安全',     isDefault: true },
  { id: 'eating',     name: '食事・アレルギー', isDefault: true },
  { id: 'water_play', name: '水遊び・プール',  isDefault: true },
  { id: 'outdoor',    name: '園庭・外遊び',    isDefault: true },
  { id: 'excursion',  name: '園外活動・散歩',  isDefault: true },
  { id: 'first_aid',  name: '救急備品・AED',   isDefault: true },
  { id: 'disaster',   name: '災害・避難訓練',  isDefault: true },
  { id: 'intrusion',  name: '不審者対応',      isDefault: true },
  { id: 'training',   name: '職員研修',        isDefault: true },
  { id: 'infection',  name: '感染症対策',      isDefault: true },
]

interface NoticeCategoryState {
  categories: NoticeCategoryDef[]
  addCategory: (name: string) => void
  updateCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void
  resetToDefault: () => void
}

export const useNoticeCategoryStore = create<NoticeCategoryState>()(
  persist(
    (set) => ({
      categories: DEFAULT_NOTICE_CATEGORIES,
      addCategory: (name) => {
        const id = `cat_${Date.now()}`
        set((state) => ({ categories: [...state.categories, { id, name, isDefault: false }] }))
      },
      updateCategory: (id, name) => {
        set((state) => ({
          categories: state.categories.map((c) => c.id === id ? { ...c, name } : c),
        }))
      },
      deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }))
      },
      resetToDefault: () => set({ categories: DEFAULT_NOTICE_CATEGORIES }),
    }),
    { name: 'notice-category-store-v1' }
  )
)

// ==============================
// 職員資料 種別
// ==============================
export interface StaffMaterialTypeDef {
  key: string
  label: string
  description: string
  isDefault: boolean
}

const DEFAULT_STAFF_MATERIAL_TYPES: StaffMaterialTypeDef[] = [
  { key: 'morning',  label: '朝礼用1枚資料', description: '毎朝の安全確認事項をA4一枚にまとめたもの',   isDefault: true },
  { key: 'training', label: '園内研修用資料', description: '定期研修で使える詳細な解説・演習シート',       isDefault: true },
  { key: 'newcomer', label: '新人向けガイド', description: '新入職員が最初に学ぶ安全の基礎',             isDefault: true },
]

interface StaffMaterialTypeState {
  types: StaffMaterialTypeDef[]
  addType: (label: string, description: string) => void
  updateType: (key: string, label: string, description: string) => void
  deleteType: (key: string) => void
  resetToDefault: () => void
}

export const useStaffMaterialTypeStore = create<StaffMaterialTypeState>()(
  persist(
    (set) => ({
      types: DEFAULT_STAFF_MATERIAL_TYPES,
      addType: (label, description) => {
        const key = `custom_${Date.now()}`
        set((state) => ({ types: [...state.types, { key, label, description, isDefault: false }] }))
      },
      updateType: (key, label, description) => {
        set((state) => ({
          types: state.types.map((t) => t.key === key ? { ...t, label, description } : t),
        }))
      },
      deleteType: (key) => {
        set((state) => ({ types: state.types.filter((t) => t.key !== key) }))
      },
      resetToDefault: () => set({ types: DEFAULT_STAFF_MATERIAL_TYPES }),
    }),
    { name: 'staff-material-type-store-v1' }
  )
)

// ==============================
// オンボーディング
// ==============================
interface OnboardingState {
  dismissed: boolean
  showWelcome: boolean
  emergencyViewed: boolean
  dismiss: () => void
  setShowWelcome: (v: boolean) => void
  setEmergencyViewed: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      dismissed: false,
      showWelcome: false,
      emergencyViewed: false,
      dismiss: () => set({ dismissed: true }),
      setShowWelcome: (v) => set({ showWelcome: v }),
      setEmergencyViewed: () => set({ emergencyViewed: true }),
    }),
    { name: 'onboarding-store-v1' }
  )
)

// ==============================
// 午睡見守り記録
// ==============================
export interface NapCheckRecord {
  id: string
  date: string
  checked_at: string
  checked_by: string
}

interface NapCheckState {
  records: NapCheckRecord[]
  addRecord: (data: Omit<NapCheckRecord, 'id'>) => void
  clearToday: (date: string) => void
}

export const useNapCheckStore = create<NapCheckState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (data) => {
        const record = { ...data, id: `nap_${Date.now()}` }
        set((state) => ({
          records: [...state.records, record],
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushNapCheck(record, supabaseId).catch(console.error)
      },
      clearToday: (date) => {
        set((state) => ({
          records: state.records.filter((r) => r.date !== date),
        }))
        const supabaseId = getSupabaseId()
        // 午睡記録削除をSupabaseにも反映（他端末にも同期）
        if (supabaseId) clearNapChecksForDateRemote(supabaseId, date).catch(console.error)
      },
    }),
    { name: 'nap-check-store-v1' }
  )
)

// ==============================
// 職員研修・資格管理
// ==============================
export interface TrainingRecord {
  id: string
  staff_name: string
  training_type: string
  completed_date: string
  expiry_date: string | null
  notes: string | null
}

interface StaffTrainingState {
  records: TrainingRecord[]
  addRecord: (data: Omit<TrainingRecord, 'id'>) => void
  deleteRecord: (id: string) => void
}

export const useStaffTrainingStore = create<StaffTrainingState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (data) => {
        const record = { ...data, id: `tr_${Date.now()}` }
        set((state) => ({
          records: [...state.records, record],
        }))
        const supabaseId = getSupabaseId()
        if (supabaseId) syncPushTrainingRecord(record, supabaseId).catch(console.error)
      },
      deleteRecord: (id) => {
        const supabaseId = getSupabaseId()
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }))
        if (supabaseId) deleteTrainingRecordRemote(id, supabaseId).catch(console.error)
      },
    }),
    { name: 'staff-training-store-v1' }
  )
)

// ==============================
// ヒヤリハットマップ ゾーン管理
// ==============================
export interface CustomZone {
  key: string
  emoji: string
  label: string
}

interface NearMissZoneState {
  customZones: CustomZone[]
  hiddenDefaults: string[]
  addZone: (emoji: string, label: string) => void
  deleteCustomZone: (key: string) => void
  toggleDefaultVisibility: (key: string) => void
  resetToDefault: () => void
}

export const useNearMissZoneStore = create<NearMissZoneState>()(
  persist(
    (set) => ({
      customZones: [],
      hiddenDefaults: [],
      addZone: (emoji, label) => {
        const key = `custom_${Date.now()}`
        set((state) => ({ customZones: [...state.customZones, { key, emoji, label }] }))
      },
      deleteCustomZone: (key) => {
        set((state) => ({ customZones: state.customZones.filter((z) => z.key !== key) }))
      },
      toggleDefaultVisibility: (key) => {
        set((state) => ({
          hiddenDefaults: state.hiddenDefaults.includes(key)
            ? state.hiddenDefaults.filter((k) => k !== key)
            : [...state.hiddenDefaults, key],
        }))
      },
      resetToDefault: () => set({ customZones: [], hiddenDefaults: [] }),
    }),
    { name: 'near-miss-zone-store-v1' }
  )
)

// ==============================
// 職員管理ストア
// ==============================
export type StaffRole = '園長' | '主任' | '保育士' | '栄養士' | '事務' | 'その他'

export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  note: string
}

interface StaffManagementState {
  members: StaffMember[]
  addMember: (name: string, role: StaffRole, note: string) => void
  updateMember: (id: string, updates: Partial<Omit<StaffMember, 'id'>>) => void
  deleteMember: (id: string) => void
}

export const useStaffManagementStore = create<StaffManagementState>()(
  persist(
    (set) => ({
      members: [],
      addMember: (name, role, note) => {
        const id = `staff_${Date.now()}`
        set((state) => ({ members: [...state.members, { id, name, role, note }] }))
      },
      updateMember: (id, updates) => {
        set((state) => ({
          members: state.members.map((m) => m.id === id ? { ...m, ...updates } : m),
        }))
      },
      deleteMember: (id) => {
        set((state) => ({ members: state.members.filter((m) => m.id !== id) }))
      },
    }),
    { name: 'staff-management-store-v1' }
  )
)
