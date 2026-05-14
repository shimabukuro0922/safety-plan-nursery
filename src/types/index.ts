// ==============================
// ステータス型
// ==============================
export type ReportStatus = 'draft' | 'reviewing' | 'approved' | 'rejected'
export type ChecklistItemStatus = 'pending' | 'done' | 'excluded' | 'deferred'
export type PlanStatus = 'draft' | 'active' | 'archived'
export type ReportType =
  | 'monthly_safety'
  | 'incident_review'
  | 'training'
  | 'guardian_notice_record'
  | 'plan_review'
  | 'annual_summary'
  | 'audit_evidence'
export type ReportStyle = 'internal' | 'guardian' | 'government' | 'audit'

// ==============================
// 施設
// ==============================
export interface Facility {
  id: string
  name: string
  capacity: number | null
  staff_count: number | null
  age_range_min: number
  age_range_max: number
  director_name: string | null
  address: string | null
  phone: string | null
  /** Supabase の facilities.id (UUID)。マルチデバイス同期に使用 */
  supabaseId?: string | null
  /** 6文字の施設参加コード。スタッフが別端末で参加する際に使用 */
  code?: string | null
}

// ==============================
// カテゴリ
// ==============================
export interface SafetyCategory {
  id: string
  name: string
  slug: string
  sort_order: number
}

// ==============================
// 安全計画
// ==============================
export interface SafetyPlan {
  id: string
  facility_id: string
  title: string
  fiscal_year: number
  status: PlanStatus
  valid_from: string | null
  valid_until: string | null
  created_at: string
  updated_at: string
}

export interface SafetyPlanItem {
  id: string
  safety_plan_id: string
  safety_category_id: string
  title: string
  description: string | null
  scheduled_months: number[]
  frequency_type: 'monthly' | 'seasonal' | 'annual' | 'as_needed'
  responsible_role: string | null
  sort_order: number
  safety_categories?: SafetyCategory
}

// ==============================
// チェックリスト
// ==============================
export interface Checklist {
  id: string
  facility_id: string
  safety_plan_id: string | null
  checklist_type: 'monthly' | 'seasonal'
  target_year: number
  target_month: number | null
  target_season: 'spring' | 'summer' | 'autumn' | 'winter' | null
  status: 'open' | 'in_progress' | 'completed' | 'submitted'
  completed_at: string | null
  created_at: string
  updated_at: string
  checklist_items?: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  category_id: string
  title: string
  description: string | null
  status: ChecklistItemStatus
  done_at: string | null
  done_by: string | null
  exclude_reason: string | null
  notes: string | null
  sort_order: number
  safety_categories?: SafetyCategory
}

// ==============================
// 報告書
// ==============================
export interface ReportSection {
  id: string
  title: string
  body: string
  ai_generated: boolean
  last_edited_by: 'ai' | 'human'
}

export interface ReportContent {
  title: string
  sections: ReportSection[]
  missing_info: string[]
  suggestions: string[]
}

export interface Report {
  id: string
  facility_id: string
  title: string
  report_type: ReportType
  style: ReportStyle
  status: ReportStatus
  current_version: number
  approved_by: string | null
  approved_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReportVersion {
  id: string
  report_id: string
  version: number
  content: ReportContent
  change_note: string | null
  is_ai_draft: boolean
  created_by: string
  created_at: string
}

// ==============================
// 研修
// ==============================
export interface Training {
  id: string
  facility_id: string
  title: string
  training_type: 'internal' | 'external' | 'self_study'
  held_date: string
  duration_min: number | null
  instructor: string | null
  content: string | null
  created_at: string
}

// ==============================
// 保護者周知
// ==============================
export interface GuardianNotice {
  id: string
  facility_id: string
  title: string
  content: string
  style: 'gentle' | 'standard' | 'formal'
  distributed_at: string | null
  created_at: string
}

// ==============================
// ヒヤリハット
// ==============================
export type NearMissScene =
  | 'nap' | 'eating' | 'water_play' | 'outdoor' | 'excursion'
  | 'bus' | 'facility' | 'other'

export type NearMissStep = 'occurred' | 'cause' | 'action' | 'shared' | 'recheck'

export interface NearMiss {
  id: string
  facility_id: string
  occurred_at: string
  scene: NearMissScene
  what_happened: string
  why_it_happened: string | null
  what_to_change: string | null
  shared_with: string | null
  recheck_date: string | null
  step: NearMissStep
  created_by: string
  created_at: string
  updated_at: string
}

export const NEAR_MISS_SCENE_LABELS: Record<NearMissScene, string> = {
  nap: '午睡',
  eating: '食事',
  water_play: '水遊び・プール',
  outdoor: '園庭・外遊び',
  excursion: '園外活動・散歩',
  bus: 'バス送迎',
  facility: '施設・設備',
  other: 'その他',
}

export const NEAR_MISS_STEP_CONFIG: Record<NearMissStep, { label: string; color: string; order: number }> = {
  occurred:  { label: '発生記録',   color: 'bg-red-100 text-red-700',    order: 1 },
  cause:     { label: '原因分析',   color: 'bg-orange-100 text-orange-700', order: 2 },
  action:    { label: '対策決定',   color: 'bg-yellow-100 text-yellow-700', order: 3 },
  shared:    { label: '職員共有済', color: 'bg-blue-100 text-blue-700',   order: 4 },
  recheck:   { label: '再確認済',   color: 'bg-green-100 text-green-700', order: 5 },
}

// ==============================
// UI補助
// ==============================
export interface NavItem {
  label: string
  path: string
  icon: string
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  monthly_safety: '月次安全実施報告書',
  incident_review: 'ヒヤリハット振り返り報告書',
  training: '職員研修実施報告書',
  guardian_notice_record: '保護者周知記録',
  plan_review: '安全計画見直し報告書',
  annual_summary: '年間総括レポート',
  audit_evidence: '監査・証跡まとめ資料',
}

export const REPORT_STYLE_LABELS: Record<ReportStyle, string> = {
  internal: '園内共有向け',
  guardian: '保護者向け',
  government: '行政提出向け',
  audit: '監査説明向け',
}

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; color: string }
> = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-700' },
  reviewing: { label: 'レビュー中', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '承認済み', color: 'bg-green-100 text-green-700' },
  rejected: { label: '差し戻し', color: 'bg-red-100 text-red-700' },
}

export const CHECKLIST_STATUS_CONFIG: Record<
  ChecklistItemStatus,
  { label: string; color: string }
> = {
  pending: { label: '未実施', color: 'bg-orange-100 text-orange-700' },
  done: { label: '実施済み', color: 'bg-green-100 text-green-700' },
  excluded: { label: '除外', color: 'bg-gray-100 text-gray-500' },
  deferred: { label: '延期', color: 'bg-blue-100 text-blue-700' },
}
