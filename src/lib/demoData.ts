/**
 * デモモード用のサンプルデータ
 * 現在のZustandストア型に合わせたデータ定義
 */
import type { NearMiss } from '@/types'
import type { AnnualPlanMonth, TrainingRecord, NapCheckRecord } from '@/stores/appStore'

const d = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString()
const dateStr = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0]
const futureDate = (daysAhead: number) =>
  new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0]

// ==============================
// ヒヤリハット
// ==============================
export const DEMO_NEAR_MISSES: NearMiss[] = [
  {
    id: 'demo_nm1',
    facility_id: 'demo',
    occurred_at: dateStr(5),
    scene: 'outdoor',
    location: 'sandbox',
    what_happened: '園庭で走っていた3歳児が砂場の縁につまずき、転倒しそうになった。近くにいた保育士がすぐに支えたため怪我はなかった。',
    why_it_happened: '砂場の縁のコンクリートが少し突き出ていた。子どもが走りながら足元を見ていなかった。',
    what_to_change: '砂場縁の突起部分を補修する。走り回る際は「歩いてね」の声かけを徹底する。',
    shared_with: '全職員（朝礼にて）',
    recheck_date: futureDate(25),
    step: 'shared',
    created_by: '田中 花子',
    created_at: d(5),
    updated_at: d(2),
  },
  {
    id: 'demo_nm2',
    facility_id: 'demo',
    occurred_at: dateStr(12),
    scene: 'eating',
    location: 'dining',
    what_happened: '昼食時、アレルギー児のトレーに誤って通常食を置きかけた。配膳担当者が気づき、提供前に確認して未然に防いだ。',
    why_it_happened: '配膳担当が普段と異なる職員だった。アレルギー児のトレーに色別マークが貼られていなかった。',
    what_to_change: 'アレルギー児のトレーに赤いシールを貼る。配膳前の声出し確認ルールを明文化する。',
    shared_with: null,
    recheck_date: null,
    step: 'action',
    created_by: '鈴木 一郎',
    created_at: d(12),
    updated_at: d(10),
  },
  {
    id: 'demo_nm3',
    facility_id: 'demo',
    occurred_at: dateStr(20),
    scene: 'nap',
    location: 'nap_room',
    what_happened: '午睡中、2歳児がうつぶせになっているのを巡回で発見。すぐに仰向けに直した。',
    why_it_happened: null,
    what_to_change: null,
    shared_with: null,
    recheck_date: null,
    step: 'occurred',
    created_by: '山本 さくら',
    created_at: d(20),
    updated_at: d(20),
  },
  {
    id: 'demo_nm4',
    facility_id: 'demo',
    occurred_at: dateStr(3),
    scene: 'outdoor',
    location: 'playground',
    what_happened: '遊具のブランコで5歳児が立ち乗りしようとしているのを発見。声かけで未然に防いだ。',
    why_it_happened: null,
    what_to_change: null,
    shared_with: null,
    recheck_date: null,
    step: 'occurred',
    created_by: '田中 花子',
    created_at: d(3),
    updated_at: d(3),
  },
  {
    id: 'demo_nm5',
    facility_id: 'demo',
    occurred_at: dateStr(8),
    scene: 'outdoor',
    location: 'sandbox',
    what_happened: '砂場の近くに割れたプラスチック片が落ちており、踏む前に職員が気づいた。',
    why_it_happened: '前日の片付けで見落としがあった。',
    what_to_change: '砂場使用後の異物チェックをルール化する。',
    shared_with: null,
    recheck_date: null,
    step: 'action',
    created_by: '鈴木 一郎',
    created_at: d(8),
    updated_at: d(7),
  },
]

// ==============================
// 職員研修・資格管理
// ==============================
export const DEMO_TRAINING_RECORDS: TrainingRecord[] = [
  {
    id: 'demo_tr1',
    staff_name: '田中 花子',
    training_type: 'AED・心肺蘇生法',
    completed_date: dateStr(7),
    expiry_date: futureDate(358),
    notes: '消防署の外部研修に参加。修了証あり。',
  },
  {
    id: 'demo_tr2',
    staff_name: '鈴木 一郎',
    training_type: '誤嚥・窒息対応',
    completed_date: dateStr(30),
    expiry_date: futureDate(335),
    notes: 'ハイムリック法・背部叩打法の実演確認済み。',
  },
  {
    id: 'demo_tr3',
    staff_name: '山本 さくら',
    training_type: 'アレルギー対応研修',
    completed_date: dateStr(60),
    expiry_date: null,
    notes: null,
  },
  {
    id: 'demo_tr4',
    staff_name: '田中 花子',
    training_type: '防災・避難訓練',
    completed_date: dateStr(90),
    expiry_date: null,
    notes: '地震・火災の複合訓練を実施。',
  },
]

// ==============================
// 月次チェック実施済み
// ==============================
export const DEMO_CHECKLIST_DONE: Record<string, { done_at: string; done_by: string; notes?: string }> = {
  ci01: { done_at: d(3),  done_by: '田中 花子', notes: undefined },
  ci03: { done_at: d(5),  done_by: '鈴木 一郎', notes: undefined },
  ci06: { done_at: d(2),  done_by: '田中 花子', notes: '消耗品を補充済み' },
  ci09: { done_at: d(10), done_by: '山本 さくら', notes: undefined },
}

// ==============================
// 季節前チェック実施済み
// ==============================
export const DEMO_SEASONAL_DONE: Record<string, { done_at: string; done_by: string }> = {
  spring_pool:  { done_at: d(14), done_by: '田中 花子' },
  spring_equip: { done_at: d(10), done_by: '鈴木 一郎' },
  summer_heat:  { done_at: d(3),  done_by: '山本 さくら' },
}

// ==============================
// 年間安全カレンダー
// ==============================
export const DEMO_ANNUAL_PLANS: AnnualPlanMonth[] = [
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

// ==============================
// 午睡見守り記録
// ==============================
const today = new Date().toISOString().split('T')[0]
const yesterday = dateStr(1)

export const DEMO_NAP_CHECKS: NapCheckRecord[] = [
  { id: 'demo_nap1', date: today,     checked_at: `${today}T13:00:00`, checked_by: '田中 花子' },
  { id: 'demo_nap2', date: today,     checked_at: `${today}T13:05:00`, checked_by: '田中 花子' },
  { id: 'demo_nap3', date: today,     checked_at: `${today}T13:10:00`, checked_by: '鈴木 一郎' },
  { id: 'demo_nap4', date: yesterday, checked_at: `${yesterday}T13:00:00`, checked_by: '山本 さくら' },
  { id: 'demo_nap5', date: yesterday, checked_at: `${yesterday}T13:05:00`, checked_by: '山本 さくら' },
]

// ==============================
// 園児（写真NGフラグのサンプル含む）
// ==============================
export const DEMO_CHILDREN = [
  { id: 'demo_ch1', name: '佐藤 みこと', className: 'もも組（3歳）',     isPhotoNG: false, ngReason: null, createdAt: d(60) },
  { id: 'demo_ch2', name: '高橋 りく',   className: 'もも組（3歳）',     isPhotoNG: false, ngReason: null, createdAt: d(60) },
  { id: 'demo_ch3', name: '伊藤 あかり', className: 'たんぽぽ組（4歳）', isPhotoNG: true,  ngReason: '保護者の意向により写真掲載不可', createdAt: d(60) },
  { id: 'demo_ch4', name: '渡辺 こはる', className: 'たんぽぽ組（4歳）', isPhotoNG: false, ngReason: null, createdAt: d(60) },
  { id: 'demo_ch5', name: '小林 りょう', className: 'さくら組（5歳）',   isPhotoNG: false, ngReason: null, createdAt: d(60) },
  { id: 'demo_ch6', name: '加藤 はな',   className: 'さくら組（5歳）',   isPhotoNG: false, ngReason: null, createdAt: d(60) },
]
