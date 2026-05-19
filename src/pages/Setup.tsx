import React, { useState, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  ShieldCheck, ChevronRight, ClipboardCheck, Users,
  Siren, Camera, Link2, Plus, Eye, EyeOff, PlayCircle, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { createFacilityInSupabase, getFacilityByCode, initFacilityAuth } from '@/lib/sync'
import { isSupabaseConfigured } from '@/lib/supabase'
import { hashPIN, verifyPIN, markPINVerified } from '@/lib/pinAuth'
import { loadDemoData } from '@/lib/demo'
import { validateInviteCode, consumeInviteCode } from '@/lib/inviteCode'
import { useOnboardingStore } from '@/stores/appStore'
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
  const { facility, isDemo, setFacility, setTrialExpiresAt, setFacilityToken } = useFacilityStore()

  // ==================== 全 hooks（早期 return より前に宣言） ====================
  const { setShowWelcome } = useOnboardingStore()

  const [mode, setMode] = useState<Mode>('new')
  const [saving, setSaving] = useState(false)

  // 招待コード: 'invite' = 入力, 'setup' = 施設情報入力
  const [newStep, setNewStep] = useState<'invite' | 'setup'>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [pendingExpiresAt, setPendingExpiresAt] = useState<string | null>(null)

  // 新規登録フォーム
  const [name, setName]               = useState('')
  const [directorName, setDirectorName] = useState('')
  const [phone, setPhone]             = useState('')
  const [newPin, setNewPin]           = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [showNewPin, setShowNewPin]   = useState(false)

  // コード参加フォーム
  const [joinCode, setJoinCode]       = useState('')
  const [joinStep, setJoinStep]       = useState<'code' | 'pin'>('code')
  const [pendingFacility, setPendingFacility] = useState<{
    id: string; code: string; name: string
    director_name: string | null; phone: string | null; pin_hash: string | null
  } | null>(null)
  const [joinPin, setJoinPin]         = useState('')
  const [joinPinError, setJoinPinError] = useState<string | null>(null)
  const [showJoinPin, setShowJoinPin] = useState(false)
  const joinPinRef = useRef<HTMLInputElement>(null)

  // 施設が登録済み（非デモ）の場合はダッシュボードへリダイレクト
  // ※ hooks はすべて上で宣言済み（Rules of Hooks 準拠）
  if (facility !== null && isDemo === false) {
    return <Navigate to="/dashboard" replace />
  }

  // ==================== デモモード ====================
  const handleDemo = () => {
    loadDemoData()
    toast.success('デモモードで起動しました（さくら保育園）')
    navigate('/dashboard')
  }

  const handleValidateInviteCode = async () => {
    const code = inviteCode.trim().toUpperCase()
    if (code.length < 6) {
      toast.error('招待コードを入力してください')
      return
    }
    setSaving(true)
    try {
      const result = await validateInviteCode(code)
      if (!result.valid) {
        toast.error(result.error)
        return
      }
      setPendingExpiresAt(result.expiresAt)
      setNewStep('setup')
      toast.success('コードが確認できました。施設情報を入力してください')
    } finally {
      setSaving(false)
    }
  }

  // ==================== 新規登録 ====================
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('施設名を入力してください')
      return
    }
    // PINバリデーション（入力されている場合のみ）
    if (newPin) {
      if (newPin.length < 4) {
        toast.error('PINは4桁以上で入力してください')
        return
      }
      if (newPin !== newPinConfirm) {
        toast.error('確認用PINが一致しません')
        return
      }
    }

    setSaving(true)
    try {
      const pinHash = newPin ? await hashPIN(newPin) : null

      if (isSupabaseConfigured) {
        const result = await createFacilityInSupabase(
          name.trim(),
          directorName.trim() || null,
          phone.trim() || null,
          pinHash,
        )
        if (result) {
          const facilityId = result.id
          setFacility({
            id: facilityId,
            name: name.trim(),
            capacity: null,
            staff_count: null,
            age_range_min: 0,
            age_range_max: 5,
            director_name: directorName.trim() || null,
            address: null,
            phone: phone.trim() || null,
            supabaseId: facilityId,
            code: result.code,
            pinHash,
          })
          // 招待コードを消費してトライアル期限を保存
          if (inviteCode && pendingExpiresAt) {
            await consumeInviteCode(inviteCode, facilityId)
            setTrialExpiresAt(pendingExpiresAt)
          }
          // RLS 施設単位アクセス制御のために JWT を取得・保存
          const token = await initFacilityAuth(result.code)
          if (token) setFacilityToken(token)
          if (pinHash) markPINVerified(facilityId)
          setShowWelcome(true)
          toast.success(`施設コード「${result.code}」を発行しました。設定画面で確認できます`, { duration: 5000 })
          navigate('/dashboard')
          return
        }
        console.warn('Supabase 接続失敗。ローカルモードで続行します。')
        toast.error('クラウド保存に失敗しました。ローカルモードで登録します')
      }
      // ローカルのみ（オフライン or Supabase 未設定）
      const localId = `fac_${Date.now()}`
      setFacility({
        id: localId,
        name: name.trim(),
        capacity: null,
        staff_count: null,
        age_range_min: 0,
        age_range_max: 5,
        director_name: directorName.trim() || null,
        address: null,
        phone: phone.trim() || null,
        pinHash,
      })
      if (pendingExpiresAt) setTrialExpiresAt(pendingExpiresAt)
      if (pinHash) markPINVerified(localId)
      setShowWelcome(true)
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  // ==================== コードで参加（ステップ1: コード検索）====================
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
      if (result.pin_hash) {
        // PIN認証が必要 → ステップ2へ
        setPendingFacility(result)
        setJoinStep('pin')
        setTimeout(() => joinPinRef.current?.focus(), 100)
      } else {
        // PINなし → そのまま参加
        await completeJoin(result, null)
      }
    } finally {
      setSaving(false)
    }
  }

  // ==================== コードで参加（ステップ2: PIN検証）====================
  const handleJoinPIN = async () => {
    if (!pendingFacility) return
    if (joinPin.length < 4) {
      setJoinPinError('PINは4桁以上で入力してください')
      return
    }
    setSaving(true)
    setJoinPinError(null)
    try {
      const ok = await verifyPIN(joinPin, pendingFacility.pin_hash!)
      if (!ok) {
        setJoinPinError('PINが違います。もう一度入力してください')
        setJoinPin('')
        setTimeout(() => joinPinRef.current?.focus(), 50)
        return
      }
      await completeJoin(pendingFacility, pendingFacility.pin_hash)
    } finally {
      setSaving(false)
    }
  }

  const completeJoin = async (
    result: { id: string; code: string; name: string; director_name: string | null; phone: string | null },
    pinHash: string | null
  ) => {
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
      pinHash,
    })
    // RLS 施設単位アクセス制御のために JWT を取得・保存
    const token = await initFacilityAuth(result.code)
    if (token) setFacilityToken(token)
    // PIN検証済みとしてマーク（参加時は認証済みとみなす）
    if (pinHash) markPINVerified(result.id)
    toast.success(`「${result.name}」に参加しました`)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* ロゴ・タイトル */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">まもりすと</h1>
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
          {/* タブヘッダ（PIN入力中 or 招待コード入力中は非表示） */}
          {joinStep === 'code' && newStep === 'invite' && (
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
          )}

          {/* 新規登録 — ステップ1: 招待コード入力 */}
          {mode === 'new' && newStep === 'invite' && (
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={24} className="text-blue-500" />
                </div>
                <h2 className="text-base font-bold text-gray-900 mb-1">招待コードを入力してください</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  お申し込み後にメールでお送りした<br />
                  招待コードを入力してください。
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  招待コード <span className="text-red-500 ml-1">必須</span>
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateInviteCode()}
                  placeholder="例：ABC12345"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-center tracking-widest font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
              </div>

              <Button variant="primary" fullWidth size="lg" loading={saving} onClick={handleValidateInviteCode}>
                確認する
                <ChevronRight size={18} />
              </Button>

              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  📩 招待コードはお申し込みいただいた方にメールでお送りしています。<br />
                  お持ちでない方は<a href="https://docs.google.com/forms/d/e/1FAIpQLSdTO95TmeXWXtNbk7EqbyqJpJAJbYM27cVjZTHTxY_Rn-9Xkw/viewform" target="_blank" rel="noopener noreferrer" className="underline font-semibold">こちらからお申し込みください</a>。
                </p>
              </div>
            </div>
          )}

          {/* 新規登録 — ステップ2: 施設情報入力 */}
          {mode === 'new' && newStep === 'setup' && (
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

              {/* PINコード（任意） */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-0.5">
                    PINコード <span className="text-gray-400 font-normal ml-1">（任意・4〜8桁の数字）</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5">
                    設定するとアプリ起動時にPIN入力が必要になります
                  </p>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="例：1234"
                      maxLength={8}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPin((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {newPin.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      PINコードの確認 <span className="text-red-500 ml-1">必須</span>
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="もう一度入力"
                      maxLength={8}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        newPinConfirm && newPin !== newPinConfirm ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    {newPinConfirm && newPin !== newPinConfirm && (
                      <p className="text-xs text-red-500 mt-1">PINが一致しません</p>
                    )}
                  </div>
                )}
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

          {/* コードで参加フォーム — ステップ1: コード入力 */}
          {mode === 'join' && joinStep === 'code' && (
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
                次へ
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

          {/* コードで参加フォーム — ステップ2: PIN検証 */}
          {mode === 'join' && joinStep === 'pin' && pendingFacility && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  「{pendingFacility.name}」
                </h2>
                <p className="text-xs text-gray-500">
                  この施設はPINコードで保護されています。<br />
                  PINを入力して参加してください。
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  PINコード <span className="text-red-500 ml-1">必須</span>
                </label>
                <div className="relative">
                  <input
                    ref={joinPinRef}
                    type={showJoinPin ? 'text' : 'password'}
                    inputMode="numeric"
                    value={joinPin}
                    onChange={(e) => {
                      setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 8))
                      setJoinPinError(null)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinPIN()}
                    placeholder="4〜8桁の数字"
                    maxLength={8}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm text-center tracking-widest font-mono text-lg pr-10
                      focus:outline-none focus:ring-2 focus:ring-green-400
                      ${joinPinError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowJoinPin((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showJoinPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {joinPinError && (
                  <p className="text-xs text-red-600 mt-1.5">{joinPinError}</p>
                )}
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={saving}
                onClick={handleJoinPIN}
              >
                参加する
                <ChevronRight size={18} />
              </Button>

              <button
                onClick={() => {
                  setJoinStep('code')
                  setJoinPin('')
                  setJoinPinError(null)
                  setPendingFacility(null)
                }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                ← コード入力に戻る
              </button>
            </div>
          )}
        </div>

        {/* デモボタン */}
        <div className="text-center">
          <button
            onClick={handleDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
              bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100
              transition-colors shadow-sm"
          >
            <PlayCircle size={17} />
            デモで試す（さくら保育園）
          </button>
          <p className="text-xs text-gray-400 mt-1.5">
            登録不要・データは保存されません
          </p>
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
