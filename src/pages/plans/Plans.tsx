import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface MonthPlan {
  month: number     // 1〜12
  fiscalMonth: number  // 年度月（4月=1）
  themes: string[]
  highRisk: string[]
  done: boolean
}

const ANNUAL_PLANS: MonthPlan[] = [
  {
    month: 4, fiscalMonth: 1,
    themes: ['安全計画 職員への周知・確認', '年度初め施設点検', '新入園児の安全オリエンテーション'],
    highRisk: ['午睡', '食事・アレルギー'],
    done: true,
  },
  {
    month: 5, fiscalMonth: 2,
    themes: ['園外活動ルート確認', '交通安全指導'],
    highRisk: ['園外活動・散歩', 'バス送迎'],
    done: true,
  },
  {
    month: 6, fiscalMonth: 3,
    themes: ['水遊び・熱中症対応の準備', 'プール開き前点検'],
    highRisk: ['水遊び・プール', '熱中症'],
    done: false,
  },
  {
    month: 7, fiscalMonth: 4,
    themes: ['プール・水遊び安全点検', '熱中症対策研修'],
    highRisk: ['水遊び・プール', '園庭活動'],
    done: false,
  },
  {
    month: 8, fiscalMonth: 5,
    themes: ['台風・災害対応の確認', 'バス送迎熱中症対策'],
    highRisk: ['バス送迎', '災害対応'],
    done: false,
  },
  {
    month: 9, fiscalMonth: 6,
    themes: ['引き渡し訓練', '防災訓練（地震・火災）'],
    highRisk: ['災害対応', '不審者対応'],
    done: false,
  },
  {
    month: 10, fiscalMonth: 7,
    themes: ['不審者対応訓練', '園外活動の安全確認'],
    highRisk: ['不審者対応', '園外活動'],
    done: false,
  },
  {
    month: 11, fiscalMonth: 8,
    themes: ['感染症・嘔吐処理研修', '冬季安全準備'],
    highRisk: ['感染症対応', '食事・誤嚥'],
    done: false,
  },
  {
    month: 12, fiscalMonth: 9,
    themes: ['年末安全点検', '施設・設備の総確認'],
    highRisk: ['施設・設備全般'],
    done: false,
  },
  {
    month: 1, fiscalMonth: 10,
    themes: ['ヒヤリハット年間振り返り', '職員研修（前半まとめ）'],
    highRisk: ['午睡', '食事・アレルギー'],
    done: false,
  },
  {
    month: 2, fiscalMonth: 11,
    themes: ['次年度計画の準備・草案作成', '卒園前の安全確認'],
    highRisk: ['バス送迎', '施設点検'],
    done: false,
  },
  {
    month: 3, fiscalMonth: 12,
    themes: ['安全計画の年間見直し・評価', '次年度計画の承認・周知'],
    highRisk: ['年度末施設点検'],
    done: false,
  },
]

export const Plans: React.FC = () => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1

  const [openMonth, setOpenMonth] = useState<number | null>(currentMonth)

  const toggle = (month: number) => {
    setOpenMonth((prev) => (prev === month ? null : month))
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="年間安全カレンダー"
        subtitle="4月〜3月の安全活動スケジュール"
      />

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-700 break-anywhere">
          各月をタップすると、その月のテーマと重点場面を確認できます。
          今月（{format(now, 'M月', { locale: ja })}）が強調表示されています。
        </p>
      </Card>

      <div className="space-y-2">
        {ANNUAL_PLANS.map((plan) => {
          const isCurrentMonth = plan.month === currentMonth
          const isOpen = openMonth === plan.month

          return (
            <Card
              key={plan.month}
              className={`overflow-hidden ${isCurrentMonth ? 'border-2 border-blue-400' : ''}`}
            >
              {/* ヘッダー行 */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => toggle(plan.month)}
              >
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                  isCurrentMonth ? 'bg-blue-600 text-white' :
                  plan.done ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="text-xs font-bold leading-tight">
                    {plan.month}月
                  </span>
                  {plan.done && <CheckCircle2 size={12} className="mt-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold break-anywhere ${isCurrentMonth ? 'text-blue-800' : 'text-gray-800'}`}>
                      {plan.themes[0]}
                    </p>
                    {isCurrentMonth && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium shrink-0">
                        今月
                      </span>
                    )}
                    {plan.done && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                        済
                      </span>
                    )}
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                }
              </button>

              {/* 展開コンテンツ */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">この月のテーマ</p>
                    <div className="space-y-1">
                      {plan.themes.map((theme) => (
                        <div key={theme} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                          <p className="text-sm text-gray-700 break-anywhere">{theme}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">重点場面</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.highRisk.map((risk) => (
                        <span
                          key={risk}
                          className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full break-anywhere"
                        >
                          {risk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="p-4 bg-gray-50">
        <p className="text-xs text-gray-500 break-anywhere">
          ※ 各月の活動内容は、園の実情に合わせて編集できます（次バージョンで対応予定）
        </p>
      </Card>

      <div className="h-4" />
    </div>
  )
}

export default Plans
