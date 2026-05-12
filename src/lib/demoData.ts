import type {
  SafetyCategory,
  SafetyPlan,
  Checklist,
  Report,
  Training,
  GuardianNotice,
  NearMiss,
} from '@/types'

export const DEMO_CATEGORIES: SafetyCategory[] = [
  { id: 'c1', name: '午睡', slug: 'nap', sort_order: 1 },
  { id: 'c2', name: '食事・誤嚥', slug: 'eating', sort_order: 2 },
  { id: 'c3', name: '水遊び・プール', slug: 'water_play', sort_order: 3 },
  { id: 'c4', name: '園庭・外遊び', slug: 'outdoor', sort_order: 4 },
  { id: 'c5', name: '園外活動・散歩', slug: 'excursion', sort_order: 5 },
  { id: 'c6', name: 'トイレ・水まわり衛生', slug: 'sanitation', sort_order: 6 },
  { id: 'c7', name: '救急備品・AED', slug: 'first_aid', sort_order: 7 },
  { id: 'c8', name: '災害対応', slug: 'disaster', sort_order: 8 },
  { id: 'c9', name: '不審者対応', slug: 'intrusion', sort_order: 9 },
  { id: 'c10', name: '119番・救急対応', slug: 'emergency', sort_order: 10 },
  { id: 'c11', name: 'バス送迎', slug: 'bus', sort_order: 11 },
  { id: 'c12', name: '保護者周知', slug: 'guardian_notice', sort_order: 12 },
  { id: 'c13', name: '職員研修', slug: 'training', sort_order: 13 },
  { id: 'c14', name: '再発防止・見直し', slug: 'review', sort_order: 14 },
]

export const DEMO_PLAN: SafetyPlan = {
  id: 'plan1',
  facility_id: 'fac1',
  title: 'R7年度 年間安全計画',
  fiscal_year: 2025,
  status: 'active',
  valid_from: '2025-04-01',
  valid_until: '2026-03-31',
  created_at: '2025-04-01T09:00:00Z',
  updated_at: '2025-04-01T09:00:00Z',
}

const now = new Date()
const thisYear = now.getFullYear()
const thisMonth = now.getMonth() + 1

export const DEMO_CHECKLIST: Checklist = {
  id: 'cl1',
  facility_id: 'fac1',
  safety_plan_id: 'plan1',
  checklist_type: 'monthly',
  target_year: thisYear,
  target_month: thisMonth,
  target_season: null,
  status: 'in_progress',
  completed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  checklist_items: [
    {
      id: 'ci1', checklist_id: 'cl1', category_id: 'c1',
      title: '午睡中の呼吸確認（5分ごとにチェック）',
      description: 'うつぶせ・横向きを仰向けに直し、顔色・胸の動きを確認する',
      status: 'done', done_at: new Date().toISOString(), done_by: '田中 花子',
      exclude_reason: null, notes: null, sort_order: 1,
      safety_categories: DEMO_CATEGORIES[0],
    },
    {
      id: 'ci2', checklist_id: 'cl1', category_id: 'c1',
      title: '午睡センサーの動作確認',
      description: '電池残量・接続状態を確認する',
      status: 'pending', done_at: null, done_by: null,
      exclude_reason: null, notes: null, sort_order: 2,
      safety_categories: DEMO_CATEGORIES[0],
    },
    {
      id: 'ci3', checklist_id: 'cl1', category_id: 'c2',
      title: '食事中のアレルギー確認手順の実施',
      description: '個別チェックシートと照合し、提供前に二重確認する',
      status: 'done', done_at: new Date().toISOString(), done_by: '鈴木 一郎',
      exclude_reason: null, notes: null, sort_order: 3,
      safety_categories: DEMO_CATEGORIES[1],
    },
    {
      id: 'ci4', checklist_id: 'cl1', category_id: 'c2',
      title: '誤嚥対応訓練の実施（年4回）',
      description: 'ハイムリック法・背部叩打法の確認',
      status: 'pending', done_at: null, done_by: null,
      exclude_reason: null, notes: null, sort_order: 4,
      safety_categories: DEMO_CATEGORIES[1],
    },
    {
      id: 'ci5', checklist_id: 'cl1', category_id: 'c7',
      title: 'AEDの電源・パッド期限確認',
      description: 'パッド使用期限・バッテリー残量を月次で確認する',
      status: 'pending', done_at: null, done_by: null,
      exclude_reason: null, notes: null, sort_order: 5,
      safety_categories: DEMO_CATEGORIES[6],
    },
    {
      id: 'ci6', checklist_id: 'cl1', category_id: 'c7',
      title: '救急箱の補充・期限確認',
      description: '消毒液・絆創膏・ガーゼ等の残量と使用期限を確認する',
      status: 'done', done_at: new Date().toISOString(), done_by: '田中 花子',
      exclude_reason: null, notes: null, sort_order: 6,
      safety_categories: DEMO_CATEGORIES[6],
    },
    {
      id: 'ci7', checklist_id: 'cl1', category_id: 'c8',
      title: '避難経路・避難場所の掲示確認',
      description: '各フロアの掲示物が見やすい場所にあることを確認する',
      status: 'excluded', done_at: null, done_by: null,
      exclude_reason: '先月実施済み', notes: null, sort_order: 7,
      safety_categories: DEMO_CATEGORIES[7],
    },
    {
      id: 'ci8', checklist_id: 'cl1', category_id: 'c13',
      title: '安全に関する職員朝礼実施',
      description: '月1回、朝礼で安全確認事項を共有する',
      status: 'pending', done_at: null, done_by: null,
      exclude_reason: null, notes: null, sort_order: 8,
      safety_categories: DEMO_CATEGORIES[12],
    },
  ],
}

export const DEMO_REPORTS: Report[] = [
  {
    id: 'r1', facility_id: 'fac1',
    title: `${thisYear}年${thisMonth}月 月次安全実施報告書`,
    report_type: 'monthly_safety', style: 'internal',
    status: 'reviewing', current_version: 2,
    approved_by: null, approved_at: null,
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r2', facility_id: 'fac1',
    title: '職員研修実施報告書（AED・救急対応）',
    report_type: 'training', style: 'internal',
    status: 'approved', current_version: 1,
    approved_by: 'user2', approved_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: 'user1',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'r3', facility_id: 'fac1',
    title: '保護者向け夏季水遊び安全周知',
    report_type: 'guardian_notice_record', style: 'guardian',
    status: 'draft', current_version: 1,
    approved_by: null, approved_at: null,
    created_by: 'user1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

export const DEMO_REPORT_CONTENT = {
  title: `${thisYear}年${thisMonth}月 月次安全実施報告書`,
  sections: [
    {
      id: 's1', title: '実施概要',
      body: `本月（${thisYear}年${thisMonth}月）の安全確認実施状況について報告いたします。月次チェック表に基づき、全14カテゴリのうち対象8項目を実施しました。うち6項目が完了、2項目が未実施となっております。`,
      ai_generated: true, last_edited_by: 'ai' as const,
    },
    {
      id: 's2', title: '実施済み項目',
      body: `午睡中の呼吸確認については、担当保育士による5分ごとの確認を全日実施しました。食事中のアレルギー確認手順については、個別チェックシートとの照合による二重確認を実施し、問題は発生しませんでした。救急箱については、消耗品の補充と使用期限の確認を完了しています。`,
      ai_generated: true, last_edited_by: 'ai' as const,
    },
    {
      id: 's3', title: '未実施項目と対応方針',
      body: `午睡センサーの動作確認およびAEDの電源確認については、今月末までに実施予定です。担当者に期限を明示して対応を依頼しました。`,
      ai_generated: true, last_edited_by: 'human' as const,
    },
    {
      id: 's4', title: '次月の重点取り組み',
      body: `来月は夏季水遊びシーズンに向けた季節前チェック（プール・水遊び安全確認）の実施を予定しています。また、職員全体への周知を目的とした朝礼資料を別途配布します。`,
      ai_generated: true, last_edited_by: 'ai' as const,
    },
  ],
  missing_info: ['実施者の氏名が一部未記入です', '除外した項目の理由記載を推奨します'],
  suggestions: ['AED確認を月初に固定することで漏れを防げます'],
}

export const DEMO_TRAININGS: Training[] = [
  {
    id: 't1', facility_id: 'fac1',
    title: 'AED・心肺蘇生法 職員研修',
    training_type: 'internal',
    held_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    duration_min: 60,
    instructor: '田中 花子（主任）',
    content: 'AEDの使い方、心肺蘇生法（CPR）の手順確認、ロールプレイ実施',
    created_at: new Date().toISOString(),
  },
  {
    id: 't2', facility_id: 'fac1',
    title: '誤嚥・窒息対応 職員研修',
    training_type: 'internal',
    held_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    duration_min: 45,
    instructor: '鈴木 一郎（安全担当）',
    content: 'ハイムリック法・背部叩打法の実演と確認',
    created_at: new Date().toISOString(),
  },
]

export const DEMO_NEAR_MISSES: NearMiss[] = [
  {
    id: 'nm1',
    facility_id: 'fac1',
    occurred_at: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    scene: 'outdoor',
    what_happened: '園庭で走っていた3歳児が砂場の縁につまずき、転倒しそうになった。近くにいた保育士がすぐに支えたため怪我はなかった。',
    why_it_happened: '砂場の縁のコンクリートが少し突き出ていた。子どもが走りながら見ていなかった。',
    what_to_change: '砂場縁の突起部分を補修する。走り回る際は「歩いてね」の声かけを徹底する。',
    shared_with: '全職員（朝礼にて）',
    recheck_date: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    step: 'shared',
    created_by: '田中 花子',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'nm2',
    facility_id: 'fac1',
    occurred_at: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    scene: 'eating',
    what_happened: '昼食時、アレルギー児のトレーに誤って通常食を置きかけた。配膳担当者が気づき、提供前に確認して未然に防いだ。',
    why_it_happened: '配膳担当が普段と異なる職員だった。アレルギー児のトレーに色別マークが貼られていなかった。',
    what_to_change: 'アレルギー児のトレーに赤いシールを貼る。配膳前の声出し確認ルールを明文化する。',
    shared_with: null,
    recheck_date: null,
    step: 'action',
    created_by: '鈴木 一郎',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'nm3',
    facility_id: 'fac1',
    occurred_at: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    scene: 'nap',
    what_happened: '午睡中、2歳児がうつぶせになっているのを巡回で発見。すぐに仰向けに直した。',
    why_it_happened: null,
    what_to_change: null,
    shared_with: null,
    recheck_date: null,
    step: 'occurred',
    created_by: '山本 さくら',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
]

export const DEMO_NOTICES: GuardianNotice[] = [
  {
    id: 'n1', facility_id: 'fac1',
    title: '夏季プール・水遊びの安全について',
    content: '保護者の皆様へ\n\n夏季水遊びシーズンに向けて、安全対策についてお知らせいたします。',
    style: 'gentle',
    distributed_at: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
]
