import React, { useState, useEffect, useRef } from 'react'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useFacilityStore } from '@/stores/facilityStore'
import { verifyPIN, isPINVerified, markPINVerified } from '@/lib/pinAuth'

// ==============================
// PINGate — 施設にPINが設定されている場合、認証済みでなければ
//           子コンポーネントの代わりにPIN入力画面を表示する
// ==============================
export const PINGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { facility } = useFacilityStore()
  // セッション内認証フラグ（PIN入力成功時にtrueになり再レンダリングを起こす）
  const [sessionVerified, setSessionVerified] = useState(false)

  const hasPIN = Boolean(facility?.pinHash)
  const facilityKey = facility ? (facility.supabaseId ?? facility.id) : ''

  // PINが未設定、または今回のセッションで認証済み → 子要素を表示
  if (!hasPIN || !facility) return <>{children}</>
  if (sessionVerified || isPINVerified(facilityKey)) return <>{children}</>

  return (
    <PINEntryScreen
      facilityKey={facilityKey}
      pinHash={facility.pinHash!}
      facilityName={facility.name}
      onVerified={() => setSessionVerified(true)}
    />
  )
}

// ==============================
// PIN入力画面
// ==============================
const PINEntryScreen: React.FC<{
  facilityKey: string
  pinHash: string
  facilityName: string
  onVerified: () => void
}> = ({ facilityKey, pinHash, facilityName, onVerified }) => {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('PINは4桁以上で入力してください')
      return
    }
    setChecking(true)
    setError(null)
    try {
      const ok = await verifyPIN(pin, pinHash)
      if (ok) {
        markPINVerified(facilityKey)
        onVerified()
      } else {
        setError('PINが違います。もう一度入力してください')
        setPin('')
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* ヘッダー */}
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{facilityName}</h1>
          <p className="text-sm text-gray-500 mt-1">PINコードを入力してください</p>
        </div>

        {/* PIN入力 */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">PINコード</label>
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="4〜8桁の数字"
              maxLength={8}
              className={`w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono
                focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-12
                ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-1.5">{error}</p>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={checking || pin.length < 4}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold
            hover:bg-emerald-700 active:bg-emerald-800
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {checking ? '確認中...' : '入力する'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          PINを忘れた場合は設定画面からリセットできます
        </p>
      </div>
    </div>
  )
}

export default PINGate
