import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ChevronRight, ClipboardCheck, Users,
  Siren, Camera, Link2, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { createFacilityInSupabase, getFacilityByCode } from '@/lib/sync'
import { isSupabaseConfigured } from '@/lib/supabase'
import toast from 'react-hot-toast'

const FEATURE_PREVIEWS = [
  { icon: <ClipboardCheck size={16} className="text-blue-500" />,  label: '月次安全チェック表' },
  { icon: <Siren size={16} className="text-red-500" />,            label: '緊急対応カード' },
  { icon: <Camera size={16} className="text-green-500" />,         label: '写真管理・NG保護' },
  { icon: <Users size={16} className="text-purple-500" />,         label: '職員研修・資格管理' },
]

type Mode = 'new' | 'join'

export const Setup: React.FC = () => {
  const navigate = useNavigate()
  const { setFacility } = useFacilityStore()

  const [mode, setMode] = useState<Mode>('new')
  const [saving, setSaving] = useState(false)

  // 新規登録フォーム
  const [name, setName]               = useState('')
  const [directorName, setDirectorName] = useState('')
  const [phone, setPhone]             = useState('')

  // コード参加フォーム
  const [joinCode, setJoinCode] = useState('')

  // ==================== 新規登録 ====================
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('施設名を入力してください')
      return
    }
    setSaving(true)
    try {
      if (isSupabaseConfigured) {
        // Supabase に施設を作成し、施設コードを取得
        const result = await createFacilityInSupabase(
          name.trim(),
          directorName.trim() || null,
          phone.trim() || null,
        )
        if (result) {
          setFacility({
            id: result.id,
            name: name.trim(),
            capacity: null,
            staff_count: null,
            age_range_min: 0,
            age_range_max: 5,
            director_name: directorName.trim() || null,
            address: null,
            phone: phone.trim() || null,
            supabaseId: result.id,
            code: result.code,
          })
          toast.success(`施設コード「${result.code}」を発行しました。設定画面で確認できます`, { duration: 5000 })
          navigate('/dashboard')
          return
        }
        // Supabase 失敗 → ローカルモードにフォールバック
        console.warn('Supabase 接続失敗。ローカルモードで続行します。')
      }
      // ローカルのみ（オフライン or Supabase 未設定）
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
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  // ==================== コードで参加 ====================
  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6) {
      toast.error('6文字の施設コードを入力してください')
      return
    }
    if (!isSupabaseConfigured) {
      toast.error('クラウド接続が設定されていません')
      return
    }
    setSaving(true)
    try {
      const result = await getFacilityByCode(code)
      if (!result) {
        toast.error('施設コードが見つかりません。コードを確認してください')
        return
      }
      setFacility({
        id: result.id,
        name: result.name,
        capacity: null,
        staff_count: null,
        age_range_min: 0,
        age_range_max: 5,
        director_name: result.director_name,
        address: null,
        phone: result.phone,
        supabaseId: result.id,
        code: result.code,
      })
      toast.success(`「${result.name}」に参加しました`)
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
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

        {/* モード切り替えタブ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* タブヘッダ */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors
                ${mode === 'new'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Plus size={15} />
              新しく登録する
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors
                ${mode === 'join'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Link2 size={15} />
              コードで参加
            </button>
          </div>

          {/* 新規登録フォーム */}
          {mode === 'new' && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">施設情報を登録してください</h2>
                <p className="text-xs text-gray-500">
                  施設コードが発行され、スタッフの端末と共有できます。30秒で完了します。
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="例：098-000-0000"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={saving}
                onClick={handleCreate}
              >
                登録して始める
                <ChevronRight size={18} />
              </Button>

              <p className="text-xs text-gray-400 text-center">
                登録後、次にやることをご案内します
              </p>
            </div>
          )}

          {/* コードで参加フォーム */}
          {mode === 'join' && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">施設コードで参加</h2>
                <p className="text-xs text-gray-500">
                  園長先生の端末の「設定」画面に表示されている<br />
                  6文字の施設コードを入力してください。
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  施設コード <span className="text-red-500 ml-1">必須</span>
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="例：ABC123"
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-center tracking-widest font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-green-400"
                  autoFocus={mode === 'join'}
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {joinCode.length}/6 文字
                </p>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={saving}
                onClick={handleJoin}
              >
                参加する
                <ChevronRight size={18} />
              </Button>

              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-800 leading-relaxed">
                  📱 参加後、この端末でもすべてのデータを共有できます。<br />
                  入力した記録はリアルタイムで他の端末にも反映されます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 安心コメント */}
        <div className="space-y-1.5 text-xs text-gray-400 text-center px-2">
          <p>🔒 データはクラウドに安全に保存されます</p>
          <p>📱 施設コードを共有するだけでスタッフと同期できます</p>
          <p>🤖 AIは文面・整理の補助として使います。最終判断は園の方針に基づいて行ってください</p>
        </div>
      </div>
    </div>
  )
}

export default Setup
