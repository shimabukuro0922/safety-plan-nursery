import React from 'react'
import { Sun, Wind, Snowflake, Flower2 } from 'lucide-react'
import { Card, SectionHeader, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const SEASONS = [
  { key: 'spring', label: '春季（3〜4月）', icon: <Flower2 size={20} className="text-pink-500" />, color: 'bg-pink-50 border-pink-200', items: ['プール開き前点検', '春季遠足の安全確認', '新入園児安全オリエンテーション'] },
  { key: 'summer', label: '夏季（6〜7月）', icon: <Sun size={20} className="text-yellow-500" />, color: 'bg-yellow-50 border-yellow-200', items: ['プール・水遊び安全確認', '熱中症対策確認', 'AED・救急備品チェック'] },
  { key: 'autumn', label: '秋季（9〜10月）', icon: <Wind size={20} className="text-orange-500" />, color: 'bg-orange-50 border-orange-200', items: ['秋季遠足の安全確認', '避難訓練実施', '防犯・不審者対応確認'] },
  { key: 'winter', label: '冬季（12〜1月）', icon: <Snowflake size={20} className="text-blue-500" />, color: 'bg-blue-50 border-blue-200', items: ['暖房器具安全点検', '感染症対策確認', '避難経路の確認'] },
]

export const SeasonalChecklist: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="季節前チェック表"
        subtitle="季節ごとの安全確認を記録します"
      />
      <div className="space-y-3">
        {SEASONS.map((season) => (
          <Card key={season.key} className={`p-4 border-2 ${season.color}`}>
            <div className="flex items-center gap-3 mb-3">
              {season.icon}
              <p className="text-sm font-bold text-gray-900">{season.label}</p>
            </div>
            <ul className="space-y-1 mb-3">
              {season.items.map((item) => (
                <li key={item} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span className="break-anywhere">{item}</span>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.success(`${season.label}のチェック表を開きます（デモ）`)}
            >
              チェック表を開く
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-gray-50">
        <p className="text-xs text-gray-500 text-center break-anywhere">
          ※ 季節前チェック表の詳細機能は次バージョンで追加予定です
        </p>
      </Card>
      <div className="h-4" />
    </div>
  )
}

export default SeasonalChecklist
