import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, X, Check, RotateCcw } from 'lucide-react'
import { Card, SectionHeader, Button } from '@/components/ui'
import { useAnnualPlanStore } from '@/stores/appStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

// 年度順（4月始まり）
const FISCAL_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]

// ==============================
// 月カード（表示 ＋ 編集）
// ==============================
const MonthCard: React.FC<{
  month: number
  themes: string[]
  highRisk: string[]
  isCurrentMonth: boolean
  isOpen: boolean
  onToggle: () => void
  onSave: (month: number, themes: string[], highRisk: string[]) => void
}> = ({ month, themes, highRisk, isCurrentMonth, isOpen, onToggle, onSave }) => {
  const [editMode, setEditMode] = useState(false)
  const [editThemes, setEditThemes] = useState<string[]>(themes)
  const [editHighRisk, setEditHighRisk] = useState<string[]>(highRisk)
  const [newTheme, setNewTheme] = useState('')
  const [newRisk, setNewRisk] = useState('')

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditThemes([...themes])
    setEditHighRisk([...highRisk])
    setEditMode(true)
    if (!isOpen) onToggle()
  }

  const handleSave = () => {
    const t = editThemes.map((s) => s.trim()).filter(Boolean)
    const r = editHighRisk.map((s) => s.trim()).filter(Boolean)
    onSave(month, t, r)
    setEditMode(false)
    toast.success(`${month}月の内容を保存しました`)
  }

  const addTheme = () => {
    if (!newTheme.trim()) return
    setEditThemes((prev) => [...prev, newTheme.trim()])
    setNewTheme('')
  }

  const addRisk = () => {
    if (!newRisk.trim()) return
    setEditHighRisk((prev) => [...prev, newRisk.trim()])
    setNewRisk('')
  }

  return (
    <Card className={`overflow-hidden ${isCurrentMonth ? 'border-2 border-blue-400' : ''}`}>
      {/* ヘッダー行 */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={onToggle}
      >
        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-xs font-bold
          ${isCurrentMonth ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {month}月
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {themes.length > 0 ? (
              <p className={`text-sm font-semibold break-anywhere ${isCurrentMonth ? 'text-blue-800' : 'text-gray-800'}`}>
                {themes[0]}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">テーマ未設定</p>
            )}
            {isCurrentMonth && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium shrink-0">今月</span>
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
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          {editMode ? (
            /* ===== 編集モード ===== */
            <>
              {/* テーマ編集 */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">この月のテーマ</p>
                <div className="space-y-1.5">
                  {editThemes.map((theme, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={theme}
                        onChange={(e) => {
                          const next = [...editThemes]
                          next[i] = e.target.value
                          setEditThemes(next)
                        }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                      />
                      <button
                        onClick={() => setEditThemes((prev) => prev.filter((_, j) => j !== i))}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTheme()}
                    placeholder="テーマを追加（例：避難訓練実施）"
                    className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                  <button
                    onClick={addTheme}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* 重点場面編集 */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">重点場面</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editHighRisk.map((risk, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full"
                    >
                      {risk}
                      <button
                        onClick={() => setEditHighRisk((prev) => prev.filter((_, j) => j !== i))}
                        className="hover:text-red-900 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRisk()}
                    placeholder="追加（例：水遊び・プール）"
                    className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                  />
                  <button
                    onClick={addRisk}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="primary" fullWidth onClick={handleSave}>
                  <Check size={14} /> 保存する
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>
                  キャンセル
                </Button>
              </div>
            </>
          ) : (
            /* ===== 表示モード ===== */
            <>
              {themes.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">この月のテーマ</p>
                  <div className="space-y-1">
                    {themes.map((theme) => (
                      <div key={theme} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        <p className="text-sm text-gray-700 break-anywhere">{theme}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">テーマが登録されていません</p>
              )}

              {highRisk.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">重点場面</p>
                  <div className="flex flex-wrap gap-1.5">
                    {highRisk.map((risk) => (
                      <span key={risk} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full break-anywhere">
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors py-1 px-2 rounded-lg hover:bg-blue-50 min-h-[36px]"
              >
                <Pencil size={13} />
                この月の内容を編集する
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

// ==============================
// メインページ
// ==============================
export const Plans: React.FC = () => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const { plans, updateMonth, resetToDefault } = useAnnualPlanStore()
  const [openMonth, setOpenMonth] = useState<number | null>(currentMonth)

  const toggle = (month: number) =>
    setOpenMonth((prev) => (prev === month ? null : month))

  const handleReset = () => {
    if (window.confirm('サンプル内容を読み込みますか？現在の設定はすべて置き換えられます。')) {
      resetToDefault()
      toast.success('サンプル内容を読み込みました')
    }
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="年間安全カレンダー"
        subtitle="4月〜3月の安全活動スケジュール"
      />

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-700 break-anywhere">
          各月をタップすると内容を確認・編集できます。
          今月（{format(now, 'M月', { locale: ja })}）は青で強調表示されています。
        </p>
      </Card>

      <div className="space-y-2">
        {FISCAL_ORDER.map((month) => {
          const plan = plans.find((p) => p.month === month)
          return (
            <MonthCard
              key={month}
              month={month}
              themes={plan?.themes ?? []}
              highRisk={plan?.highRisk ?? []}
              isCurrentMonth={month === currentMonth}
              isOpen={openMonth === month}
              onToggle={() => toggle(month)}
              onSave={updateMonth}
            />
          )
        })}
      </div>

      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
      >
        <RotateCcw size={12} />
        サンプル内容を読み込む
      </button>

      <div className="h-4" />
    </div>
  )
}

export default Plans
