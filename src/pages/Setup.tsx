import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ChevronRight, ClipboardCheck, Users, Siren, Camera } from 'lucide-react'
import { Button } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import toast from 'react-hot-toast'

const FEATURE_PREVIEWS = [
  { icon: <ClipboardCheck size={16} className="text-blue-500" />, label: '月次安全チェック表' },
  { icon: <Siren size={16} className="text-red-500" />,           label: '緊急対応カード' },
  { icon: <Camera size={16} className="text-green-500" />,        label: '写真管理・NG保護' },
  { icon: <Users size={16} className="text-purple-500" />,        label: '職員研修・資格管理' },
]

export const Setup: React.FC = () => {
  const navigate = useNavigate()
  const { setFacility } = useFacilityStore()

  const [name, setName] = useState('')
  const [directorName, setDirectorName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('施設名を入力してください')
      return
    }
    setSaving(true)
    setTimeout(() => {
      setFacility({
        id: `fac_${Date.now()}`,
        name: name.trim(),
        capacity: null,
        staff_count: null,
        age_range_min: 0,
        age_range_max: 5,
        director_name: directorName.trim() || null,
        address: null,
        phone: phone.trim() || null,
      })
      setSaving(false)
      navigate('/dashboard')
    }, 600)
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* ロゴ・タイトル */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">安全計画 使える化サポート</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            毎月の点検・記録・共有・改善を、<br />
            園長先生が迷わず進められる仕組みに変えます。
          </p>
        </div>

        {/* 機能プレビュー */}
        <div className="grid grid-cols-2 gap-2">
          {FEATURE_PREVIEWS.map((f) => (
            <div key={f.label} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm">
              {f.icon}
              <span className="text-xs font-medium text-gray-700 break-anywhere">{f.label}</span>
            </div>
          ))}
        </div>

        {/* セットアップフォーム */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">まず施設情報を登録してください</h2>
            <p className="text-xs text-gray-500">
              入力した情報はこのブラウザにのみ保存されます。30秒で完了します。
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              施設名 <span className="text-red-500 ml-1">必須</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="例：さくら保育園"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              園長名 <span className="text-gray-400 font-normal ml-1">（任意）</span>
            </label>
            <input
              type="text"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="例：山田 太郎"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              電話番号 <span className="text-gray-400 font-normal ml-1">（任意）</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="例：098-000-0000"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={saving}
            onClick={handleSubmit}
          >
            はじめる
            <ChevronRight size={18} />
          </Button>

          <p className="text-xs text-gray-400 text-center">
            登録後、次にやることをご案内します
          </p>
        </div>

        {/* 安心コメント */}
        <div className="space-y-1.5 text-xs text-gray-400 text-center px-2">
          <p>📱 入力した情報はこのデバイスのブラウザにのみ保存されます</p>
          <p>🔒 外部サーバーには送信されません</p>
          <p>🤖 AIは文面・整理の補助として使います。最終判断は園の方針に基づいて行ってください</p>
        </div>
      </div>
    </div>
  )
}

export default Setup
