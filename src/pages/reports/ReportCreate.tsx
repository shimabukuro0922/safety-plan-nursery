import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { REPORT_TYPE_LABELS, REPORT_STYLE_LABELS } from '@/types'
import type { ReportType, ReportStyle } from '@/types'
import toast from 'react-hot-toast'

const REPORT_TYPES: ReportType[] = [
  'monthly_safety', 'training', 'guardian_notice_record',
  'plan_review', 'annual_summary', 'audit_evidence',
]
const REPORT_STYLES: ReportStyle[] = ['internal', 'guardian', 'government', 'audit']

export const ReportCreate: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<ReportType | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<ReportStyle>('internal')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!selectedType) return
    setIsGenerating(true)
    // デモ: 2秒待ってエディタへ
    await new Promise((r) => setTimeout(r, 2000))
    setIsGenerating(false)
    toast.success('AIが下書きを作成しました')
    navigate('/reports/r1')
  }

  return (
    <div className="px-4 py-6 space-y-5">
      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 -mt-2">
        <span>種別選択</span>
        <span className="ml-auto mr-8">文体選択</span>
        <span>AI生成</span>
      </div>

      {/* Step 1: 報告書種別 */}
      {step === 1 && (
        <>
          <SectionHeader title="どの報告書を作りますか？" />
          <div className="space-y-2">
            {REPORT_TYPES.map((type) => (
              <Card
                key={type}
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  selectedType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedType(type)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                    selectedType === type ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                  }`} />
                  <p className="text-sm font-medium text-gray-900 break-anywhere">
                    {REPORT_TYPE_LABELS[type]}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!selectedType}
            onClick={() => setStep(2)}
          >
            次へ
            <ChevronRight size={16} />
          </Button>
        </>
      )}

      {/* Step 2: 文体選択 */}
      {step === 2 && (
        <>
          <SectionHeader title="誰向けに書きますか？" />
          <div className="space-y-2">
            {REPORT_STYLES.map((style) => (
              <Card
                key={style}
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  selectedStyle === style ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedStyle(style)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                    selectedStyle === style ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                  }`} />
                  <p className="text-sm font-medium text-gray-900">{REPORT_STYLE_LABELS[style]}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setStep(1)}>戻る</Button>
            <Button variant="primary" fullWidth onClick={() => setStep(3)}>
              次へ <ChevronRight size={16} />
            </Button>
          </div>
        </>
      )}

      {/* Step 3: 確認＆生成 */}
      {step === 3 && (
        <>
          <SectionHeader title="内容を確認してAIに下書きを作らせます" />
          <Card className="p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">報告書種別</p>
              <p className="text-sm font-semibold text-gray-900 break-anywhere">
                {selectedType ? REPORT_TYPE_LABELS[selectedType] : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">文体</p>
              <p className="text-sm font-semibold text-gray-900">
                {REPORT_STYLE_LABELS[selectedStyle]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">元データ</p>
              <p className="text-sm text-gray-700">今月のチェック表・研修記録（2件）</p>
            </div>
          </Card>

          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-violet-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-violet-800">AIによる下書き作成について</p>
                <p className="text-xs text-violet-600 mt-1 leading-relaxed break-anywhere">
                  AIは記録データをもとに下書きを作成します。
                  内容は必ず人が確認・編集し、承認してから確定してください。
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setStep(2)}>戻る</Button>
            <Button
              variant="ai"
              fullWidth
              loading={isGenerating}
              onClick={handleGenerate}
            >
              <Sparkles size={16} />
              AIで下書きを作る
            </Button>
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}

export default ReportCreate
