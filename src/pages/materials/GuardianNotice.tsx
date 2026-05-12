import React, { useState } from 'react'
import { Sparkles, FileDown, Send } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { DEMO_CATEGORIES } from '@/lib/demoData'
import toast from 'react-hot-toast'

const STYLES = [
  { value: 'gentle', label: 'やわらかい文体', sub: '保護者に親しみやすく' },
  { value: 'standard', label: '標準文体', sub: '一般的なおたより形式' },
  { value: 'formal', label: '丁寧な文体', sub: '正式な通知として' },
]

export const GuardianNotice: React.FC = () => {
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [style, setStyle] = useState('gentle')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<string | null>(null)

  const toggleCat = (id: string) =>
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )

  const handleGenerate = async () => {
    if (selectedCats.length === 0) { toast.error('カテゴリを1つ以上選択してください'); return }
    setIsGenerating(true)
    await new Promise((r) => setTimeout(r, 1800))
    const catNames = DEMO_CATEGORIES.filter((c) => selectedCats.includes(c.id)).map((c) => c.name)
    setGenerated(
      `保護者の皆様へ\n\n平素より当園の教育活動にご理解・ご協力をいただき、誠にありがとうございます。\n\n今月は「${catNames.join('・')}」について、職員全員で安全確認を実施いたしました。\n\nお子様の安全のために、ご家庭でも以下の点についてお声がけいただけますと幸いです。\n\n・外遊びから戻ったら手洗い・うがいを習慣にする\n・体調が優れないときはすぐにご連絡ください\n\nご不明な点がございましたら、担任またはフロントまでお気軽にご相談ください。\n\n${new Date().getFullYear()}年${new Date().getMonth() + 1}月\nさくら保育園`
    )
    setIsGenerating(false)
    toast.success('保護者周知文を作成しました')
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader title="保護者向け周知文を作る" subtitle="AIが下書きを作成します。配布前に必ず確認してください" />

      {/* カテゴリ選択 */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">周知したいカテゴリ（複数選択可）</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCat(cat.id)}
              className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors min-h-[44px] break-anywhere
                ${selectedCats.includes(cat.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 文体選択 */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">文体</p>
        <div className="space-y-2">
          {STYLES.map((s) => (
            <Card
              key={s.value}
              className={`p-3 cursor-pointer border-2 ${style === s.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setStyle(s.value)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${style === s.value ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.sub}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Button variant="ai" fullWidth size="lg" loading={isGenerating} onClick={handleGenerate}>
        <Sparkles size={18} /> AIで文章を作る
      </Button>

      {generated && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">生成された周知文（下書き）</p>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">AI生成</span>
          </div>
          <textarea
            defaultValue={generated}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm resize-none min-h-[240px] leading-relaxed break-anywhere focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => toast.success('PDF出力（デモ）')}>
              <FileDown size={14} /> PDF出力
            </Button>
            <Button variant="primary" size="sm" fullWidth onClick={() => toast.success('配布済みとして記録しました（デモ）')}>
              <Send size={14} /> 配布済みとして記録
            </Button>
          </div>
        </Card>
      )}
      <div className="h-4" />
    </div>
  )
}

export default GuardianNotice
