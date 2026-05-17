/**
 * デモモード管理ユーティリティ
 * loadDemoData() — 全ストアにサンプルデータを投入
 * clearDemoData() — 全ストアをリセットしてセットアップ画面へ
 */
import { useFacilityStore } from '@/stores/facilityStore'
import {
  useNearMissStore,
  useChecklistStore,
  useSeasonalChecklistStore,
  useAnnualPlanStore,
  useNapCheckStore,
  useStaffTrainingStore,
  useOnboardingStore,
} from '@/stores/appStore'
import { useChildrenStore } from '@/stores/childrenStore'
import {
  DEMO_NEAR_MISSES,
  DEMO_TRAINING_RECORDS,
  DEMO_CHECKLIST_DONE,
  DEMO_SEASONAL_DONE,
  DEMO_ANNUAL_PLANS,
  DEMO_NAP_CHECKS,
  DEMO_CHILDREN,
} from './demoData'

/** デモ用の施設オブジェクト（supabaseId なし → 同期なし） */
const DEMO_FACILITY = {
  id: 'demo_facility',
  name: 'さくら保育園（デモ）',
  capacity: null,
  staff_count: null,
  age_range_min: 0,
  age_range_max: 5,
  director_name: '山田 太郎',
  address: null,
  phone: '098-000-0000',
  supabaseId: null,
  code: null,
  pinHash: null,
}

/** 全ストアにデモデータを投入する */
export function loadDemoData() {
  // 施設
  useFacilityStore.setState({ facility: DEMO_FACILITY, isDemo: true })

  // ヒヤリハット
  useNearMissStore.setState({ nearMisses: DEMO_NEAR_MISSES })

  // 月次チェック実施済み
  useChecklistStore.setState({
    doneItems: DEMO_CHECKLIST_DONE,
    lastMarkedMonth: new Date().toISOString().slice(0, 7),
  })

  // 季節前チェック実施済み
  useSeasonalChecklistStore.setState({ doneItems: DEMO_SEASONAL_DONE })

  // 年間カレンダー
  useAnnualPlanStore.setState({ plans: DEMO_ANNUAL_PLANS })

  // 午睡記録（直近2日分）
  useNapCheckStore.setState({ records: DEMO_NAP_CHECKS })

  // 職員研修・資格管理
  useStaffTrainingStore.setState({ records: DEMO_TRAINING_RECORDS })

  // 園児
  useChildrenStore.setState({ children: DEMO_CHILDREN })
}

/** 全ストアをクリアしてデモモードを終了する */
export function clearDemoData() {
  useFacilityStore.setState({ facility: null, isDemo: false })
  useNearMissStore.setState({ nearMisses: [] })
  useChecklistStore.setState({ doneItems: {}, lastMarkedMonth: null })
  useSeasonalChecklistStore.setState({ doneItems: {} })
  useNapCheckStore.setState({ records: [] })
  useStaffTrainingStore.setState({ records: [] })
  useChildrenStore.setState({ children: [] })
  // 年間カレンダーは空白に戻す（useAnnualPlanStore の初期値は BLANK）
  const blank = [1,2,3,4,5,6,7,8,9,10,11,12].map((m) => ({ month: m, themes: [] as string[], highRisk: [] as string[] }))
  useAnnualPlanStore.setState({ plans: blank })
  // デモ→本番切り替え時のウェルカム・緊急フラグリーク防止
  useOnboardingStore.setState({ showWelcome: false, emergencyViewed: false })
}
