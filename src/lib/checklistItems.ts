export interface ChecklistItemDef {
  id: string
  categoryName: string
  title: string
  description: string
}

export const MONTHLY_CHECKLIST_ITEMS: ChecklistItemDef[] = [
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
