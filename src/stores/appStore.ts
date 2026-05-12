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
      items: [],
      addItem: (item) => {
        const id = `ci_${Date.now()}`
        set((state) => ({ items: [...state.items, { ...item, id }] }))
      },
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) => item.id === id ? { ...item, ...updates } : item),
        }))
      },
      deleteItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      },
      resetToDefault: () => set({ items: DEFAULT_CHECKLIST_ITEMS }),
    }),
    { name: 'checklist-items-store-v2' }
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
      },
      resetToDefault: () => set({ plans: DEFAULT_ANNUAL_PLANS }),
    }),
    { name: 'annual-plan-store-v2' }
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
      items: [],
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
    { name: 'seasonal-items-store-v2' }
  )
)
