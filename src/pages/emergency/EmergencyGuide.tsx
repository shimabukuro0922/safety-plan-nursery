import React, { useState, useEffect } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Phone } from 'lucide-react'
import { SectionHeader } from '@/components/ui'
import { useOnboardingStore } from '@/stores/appStore'

interface Step { text: string; emphasis?: boolean }
interface EmergencyCard {
  id: string
  title: string
  subtitle: string
  color: string
  headerColor: string
  steps: Step[]
  callInfo?: string
  important?: string
}

const EMERGENCY_CARDS: EmergencyCard[] = [
  {
    id: 'choking',
    title: '誤嚥・窒息',
    subtitle: '食べ物・異物が喉に詰まった',
    color: 'border-red-300 bg-red-50',
    headerColor: 'bg-red-500 text-white',
    steps: [
      { text: '①「大丈夫？」と声をかけ反応を確認' },
      { text: '②【乳児】うつ伏せで背部叩打法を5回、仰向けで胸部突き上げを5回を繰り返す', emphasis: true },
      { text: '③【幼児・成人】後ろから腹部突き上げ（ハイムリック法）を5回', emphasis: true },
      { text: '④異物が出ない・意識消失 → 心肺蘇生を開始', emphasis: true },
      { text: '⑤119番通報・AED準備を並行して行う' },
    ],
    callInfo: '119',
    important: '乳児（1歳未満）は腹部突き上げ禁止。背部叩打と胸部突き上げを交互に。',
  },
  {
    id: 'allergy',
    title: 'アナフィラキシー',
    subtitle: 'アレルギーによる重篤な反応',
    color: 'border-orange-300 bg-orange-50',
    headerColor: 'bg-orange-500 text-white',
    steps: [
      { text: '①症状を確認：じんましん・顔の腫れ・呼吸困難・意識低下' },
      { text: '②エピペン® を処方されている場合は直ちに使用（太もも外側）', emphasis: true },
      { text: '③119番通報・「アナフィラキシーの疑い」と伝える', emphasis: true },
      { text: '④仰向けで足を高くして安静（意識あり）' },
      { text: '⑤呼吸困難がある場合は上半身を起こす' },
      { text: '⑥意識・呼吸消失 → 心肺蘇生を開始' },
      { text: '⑦保護者・かかりつけ医に連絡' },
    ],
    callInfo: '119',
    important: 'エピペン® は「打ち迷ったら打つ」。使用後も必ず病院へ搬送。',
  },
  {
    id: 'heatstroke',
    title: '熱中症',
    subtitle: '高温環境での体調不良',
    color: 'border-yellow-300 bg-yellow-50',
    headerColor: 'bg-yellow-500 text-white',
    steps: [
      { text: '①涼しい場所（冷房のある室内）に移動' },
      { text: '②衣服をゆるめ、首・脇の下・太ももを冷やす', emphasis: true },
      { text: '③意識がある → 経口補水液・スポーツ飲料を少しずつ飲ませる' },
      { text: '④意識がない・嘔吐・けいれん → 飲ませずに119番', emphasis: true },
      { text: '⑤回復しない・悪化する場合はすぐに119番' },
    ],
    callInfo: '119',
    important: '意識がない場合は絶対に口から飲ませない。誤嚥の危険あり。',
  },
  {
    id: 'seizure',
    title: 'けいれん・てんかん発作',
    subtitle: '全身のけいれん・意識消失',
    color: 'border-purple-300 bg-purple-50',
    headerColor: 'bg-purple-600 text-white',
    steps: [
      { text: '①周囲の危険物を除き、子どもを傷つけないようにする' },
      { text: '②体を押さえない・口の中に何も入れない', emphasis: true },
      { text: '③横向きに寝かせる（嘔吐による窒息予防）' },
      { text: '④時間を計る（5分以上続く場合は119番）', emphasis: true },
      { text: '⑤発作の様子をメモまたは動画撮影（医師への情報として有用）' },
      { text: '⑥発作後も意識が戻らない・呼吸異常 → 119番' },
    ],
    callInfo: '119',
    important: 'ほとんどのけいれんは2〜3分で自然に止まる。5分以上は救急要請。',
  },
  {
    id: 'cpr',
    title: '心肺蘇生（CPR）',
    subtitle: '呼吸・脈がない・意識なし',
    color: 'border-gray-400 bg-gray-50',
    headerColor: 'bg-gray-700 text-white',
    steps: [
      { text: '①肩を叩き「大丈夫ですか？」→ 反応なし', emphasis: true },
      { text: '②大声で助けを呼ぶ「AEDを持ってきて！119番して！」' },
      { text: '③呼吸確認（10秒以内）→ なし or 判断できない → 胸骨圧迫開始', emphasis: true },
      { text: '④【乳児】指2本で胸の真ん中を30回（100〜120回/分）深さ4cm' },
      { text: '⑤【幼児・小学生以上】両手で30回（100〜120回/分）深さ5〜6cm', emphasis: true },
      { text: '⑥人工呼吸2回（講習を受けた人のみ）+ 胸骨圧迫30回を繰り返す' },
      { text: '⑦AED到着次第すぐに使用・電源を入れて音声指示に従う', emphasis: true },
    ],
    callInfo: '119',
    important: '人工呼吸ができない場合は胸骨圧迫のみでも有効。止めずに続ける。',
  },
  {
    id: 'sids',
    title: 'SIDS・午睡中の異変',
    subtitle: '午睡中に呼吸・反応がない',
    color: 'border-blue-300 bg-blue-50',
    headerColor: 'bg-blue-600 text-white',
    steps: [
      { text: '①名前を呼ぶ・肩を軽くたたく → 反応確認' },
      { text: '②呼吸・胸の動き・顔色を確認', emphasis: true },
      { text: '③反応なし・呼吸なし → 119番通報・心肺蘇生を開始', emphasis: true },
      { text: '④AEDをすぐ準備させる' },
      { text: '⑤園長・主任への連絡と並行して対応' },
      { text: '⑥保護者への連絡は落ち着いてから（搬送先の病院名も伝える）' },
    ],
    callInfo: '119',
    important: '「寝ているだけ」と思わず、必ず確認を。1分1秒が命をつなぐ。',
  },
]

export const EmergencyGuide: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null)
  const { setEmergencyViewed } = useOnboardingStore()

  useEffect(() => {
    setEmergencyViewed()
  }, [setEmergencyViewed])

  return (
    <div className="px-4 py-6 space-y-4">
      <SectionHeader
        title="緊急対応カード"
        subtitle="万が一の際の対応手順です。落ち着いて確認してください"
      />

      {/* 緊急電話ボタン */}
      <a
        href="tel:119"
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 text-white font-bold text-base rounded-2xl shadow-sm active:bg-red-700 transition-colors min-h-[52px]"
      >
        <Phone size={20} />
        119番に電話する
      </a>

      <p className="text-xs text-gray-500 text-center">
        場所・状況・子どもの年齢・人数を伝えてください
      </p>

      {/* 緊急カード一覧 */}
      <div className="space-y-3">
        {EMERGENCY_CARDS.map((card) => {
          const isOpen = openId === card.id
          return (
            <div key={card.id} className={`border-2 rounded-2xl overflow-hidden ${card.color}`}>
              {/* ヘッダー */}
              <button
                onClick={() => setOpenId(isOpen ? null : card.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 ${card.headerColor} text-left`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{card.title}</p>
                    <p className="text-xs opacity-90">{card.subtitle}</p>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* 展開コンテンツ */}
              {isOpen && (
                <div className="px-4 py-4 space-y-3">
                  <div className="space-y-2">
                    {card.steps.map((step, i) => (
                      <p
                        key={i}
                        className={`text-sm leading-relaxed break-anywhere ${
                          step.emphasis ? 'font-semibold text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {step.text}
                      </p>
                    ))}
                  </div>

                  {card.important && (
                    <div className="bg-white border-l-4 border-yellow-400 px-3 py-2 rounded-r-lg">
                      <p className="text-xs text-gray-700 leading-relaxed break-anywhere">
                        ⚠️ {card.important}
                      </p>
                    </div>
                  )}

                  {card.callInfo && (
                    <a
                      href={`tel:${card.callInfo}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white font-bold text-sm rounded-xl"
                    >
                      <Phone size={16} />
                      {card.callInfo}番に電話
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          このカードは保育施設での緊急対応の目安です。日頃から救命講習を受講し、手順を確認しておきましょう。
        </p>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default EmergencyGuide
