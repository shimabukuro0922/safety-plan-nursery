import React, { useState, useRef } from 'react'
import { Building2, Save, ChevronRight, Shield, Bell, Users, Download, Upload, AlertTriangle, Smartphone, Copy, Check, RefreshCw, Lock, Eye, EyeOff, X, Map, Plus, Trash2, RotateCcw } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { useNearMissZoneStore } from '@/stores/appStore'
import { NEAR_MISS_LOCATION_GRID } from '@/types'
import { createFacilityInSupabase, updateFacilityPIN } from '@/lib/sync'
import { isSupabaseConfigured } from '@/lib/supabase'
import { hashPIN, verifyPIN, markPINVerified, clearPINVerified } from '@/lib/pinAuth'
import toast from 'react-hot-toast'

// ==============================
// バックアップ・復元ユーティリティ
// ==============================
const BACKUP_KEYS = [
  'facility-store',
  'checklist-store',
  'checklist-items-store-v3',
  'annual-plan-store-v3',
  'seasonal-checklist-store',
  'seasonal-items-store-v3',
  'near-miss-store',
  'report-store',
  'notice-category-store-v1',
  'staff-material-type-store-v1',
  'nap-check-store-v1',
  'staff-training-store-v1',
  'children-store-v1',
  'photo-store-v1',
  'near-miss-zone-store-v1',
]

function exportBackup() {
  const data: Record<string, string> = {}
  BACKUP_KEYS.forEach((key) => {
    const val = localStorage.getItem(key)
    if (val) data[key] = val
  })
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  a.href = url
  a.download = `safety-plan-backup-${dateStr}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importBackup(
  file: File,
  onSuccess: (failedKeys: string[]) => void,
  onError: () => void
) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as Record<string, string>
      const failedKeys: string[] = []
      Object.entries(data).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value)
        } catch {
          // QuotaExceededError などで書き込めなかったキーを記録
          failedKeys.push(key)
        }
      })
      onSuccess(failedKeys)
    } catch {
      onError()
    }
  }
  reader.readAsText(file)
}

// ==============================
// PINフィールド（Settings内で再利用）
// ==============================
const PINField: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  error: string | null
  autoFocus?: boolean
}> = ({ label, value, onChange, show, onToggleShow, error, autoFocus }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
        maxLength={8}
        autoFocus={autoFocus}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-center tracking-widest font-mono pr-10
          focus:outline-none focus:ring-2 focus:ring-blue-400
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
)

// ==============================
// ゾーン管理
// ==============================
const ZoneManager: React.FC = () => {
  const { customZones, hiddenDefaults, addZone, deleteCustomZone, toggleDefaultVisibility, resetToDefault } = useNearMissZoneStore()
  const [showForm, setShowForm] = useState(false)
  const [emoji, setEmoji] = useState('')
  const [label, setLabel] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const handleAdd = () => {
    if (!label.trim()) { toast.error('ゾーン名を入力してください'); return }
    const e = emoji.trim() || '📍'
    addZone(e, label.trim())
    setEmoji(''); setLabel(''); setShowForm(false)
    toast.success(`ゾーン「${e} ${label.trim()}」を追加しました`)
  }

  const handleReset = () => {
    resetToDefault()
    setConfirmReset(false)
    toast.success('デフォルト設定に戻しました')
  }

  return (
    <div className="space-y-4">
      {/* デフォルトゾーン */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">
          デフォルトゾーン
          <span className="text-gray-400 font-normal ml-1">（目のアイコンで表示/非表示）</span>
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {NEAR_MISS_LOCATION_GRID.map((zone) => {
            const hidden = hiddenDefaults.includes(zone.key)
            return (
              <button
                key={zone.key}
                onClick={() => toggleDefaultVisibility(zone.key)}
                className={`flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs border transition-colors text-left ${
                  hidden
                    ? 'bg-gray-100 border-gray-200 text-gray-400 line-through'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                <span className="text-base shrink-0">{zone.emoji}</span>
                <span className="flex-1 break-anywhere leading-tight">{zone.label}</span>
                {hidden
                  ? <EyeOff size={12} className="shrink-0 text-gray-400" />
                  : <Eye size={12} className="shrink-0 text-gray-300" />
                }
              </button>
            )
          })}
        </div>
      </div>

      {/* カスタムゾーン */}
      {customZones.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">カスタムゾーン</p>
          <div className="space-y-1.5">
            {customZones.map((zone) => (
              <div key={zone.key} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-base shrink-0">{zone.emoji}</span>
                <span className="flex-1 text-sm text-gray-800 break-anywhere">{zone.label}</span>
                <button
                  onClick={() => { deleteCustomZone(zone.key); toast.success('ゾーンを削除しました') }}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ゾーン追加フォーム */}
      {showForm ? (
        <div className="border border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50">
          <p className="text-xs font-semibold text-gray-700">新しいゾーンを追加</p>
          <div className="flex gap-2">
            <div className="w-16 shrink-0">
              <label className="text-xs text-gray-500 block mb-1">絵文字</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                placeholder="🏊"
                className="w-full border border-gray-300 rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">ゾーン名 <span className="text-red-500">必須</span></label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="例：プール室"
                maxLength={20}
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" fullWidth onClick={handleAdd}>追加する</Button>
            <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setEmoji(''); setLabel('') }}>
              <X size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" fullWidth onClick={() => setShowForm(true)}>
          <Plus size={15} />
          ゾーンを追加する
        </Button>
      )}

      {/* リセット */}
      {(customZones.length > 0 || hiddenDefaults.length > 0) && (
        confirmReset ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
            <p className="text-xs text-orange-800">カスタムゾーンを削除し、非表示設定もすべてリセットします。よろしいですか？</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" fullWidth onClick={handleReset}>リセットする</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>キャンセル</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            <RotateCcw size={12} />
            デフォルトに戻す
          </button>
        )
      )}
    </div>
  )
}

export const Settings: React.FC = () => {
  const { facility, setFacility } = useFacilityStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [publishingCode, setPublishingCode] = useState(false)
  const [form, setForm] = useState({
    name: facility?.name ?? '',
    director_name: facility?.director_name ?? '',
    address: facility?.address ?? '',
    phone: facility?.phone ?? '',
    capacity: String(facility?.capacity ?? ''),
    staff_count: String(facility?.staff_count ?? ''),
  })

  // ==============================
  // PIN管理
  // ==============================
  // pinAction: null=表示のみ, 'set'=新規設定, 'change-verify'=変更前の現PIN確認,
  //            'change-new'=新PINの入力, 'remove-verify'=削除前の現PIN確認
  type PINAction = null | 'set' | 'change-verify' | 'change-new' | 'remove-verify'
  const [pinAction, setPinAction] = useState<PINAction>(null)
  const [pinVal, setPinVal]         = useState('')
  const [pinConfirmVal, setPinConfirmVal] = useState('')
  const [pinError, setPinError]     = useState<string | null>(null)
  const [pinWorking, setPinWorking] = useState(false)
  const [showPin, setShowPin]       = useState(false)

  const facilityKey = facility ? (facility.supabaseId ?? facility.id) : ''

  const resetPINForm = () => {
    setPinVal('')
    setPinConfirmVal('')
    setPinError(null)
    setShowPin(false)
    setPinAction(null)
  }

  /** PIN設定・変更・削除後にローカルストアとSupabaseを更新する共通関数 */
  const applyPINChange = async (newHash: string | null, successMsg: string) => {
    if (!facility) return
    setPinWorking(true)
    try {
      // ローカルストア更新
      setFacility({ ...facility, pinHash: newHash })
      // Supabase同期（失敗してもローカルには保存済み）
      if (facility.supabaseId) {
        await updateFacilityPIN(facility.supabaseId, newHash)
      }
      // セッション認証フラグの更新
      if (newHash) {
        markPINVerified(facilityKey)  // 設定直後は認証済みとみなす
      } else {
        clearPINVerified(facilityKey)
      }
      toast.success(successMsg)
      resetPINForm()
    } finally {
      setPinWorking(false)
    }
  }

  /** PINを新規設定する */
  const handleSetPIN = async () => {
    if (pinVal.length < 4) { setPinError('PINは4桁以上で入力してください'); return }
    if (pinVal !== pinConfirmVal) { setPinError('確認用PINが一致しません'); return }
    const hash = await hashPIN(pinVal)
    await applyPINChange(hash, 'PINコードを設定しました')
  }

  /** 変更前に現PINを確認する */
  const handleVerifyCurrentForChange = async () => {
    if (!facility?.pinHash) return
    if (pinVal.length < 4) { setPinError('PINを入力してください'); return }
    setPinWorking(true)
    setPinError(null)
    try {
      const ok = await verifyPIN(pinVal, facility.pinHash)
      if (!ok) { setPinError('PINが違います'); return }
      setPinVal('')
      setPinAction('change-new')
    } finally {
      setPinWorking(false)
    }
  }

  /** 新PINに変更する */
  const handleChangePIN = async () => {
    if (pinVal.length < 4) { setPinError('PINは4桁以上で入力してください'); return }
    if (pinVal !== pinConfirmVal) { setPinError('確認用PINが一致しません'); return }
    const hash = await hashPIN(pinVal)
    await applyPINChange(hash, 'PINコードを変更しました')
  }

  /** 削除前に現PINを確認する */
  const handleVerifyCurrentForRemove = async () => {
    if (!facility?.pinHash) return
    if (pinVal.length < 4) { setPinError('PINを入力してください'); return }
    setPinWorking(true)
    setPinError(null)
    try {
      const ok = await verifyPIN(pinVal, facility.pinHash)
      if (!ok) { setPinError('PINが違います'); return }
      await applyPINChange(null, 'PINコードを削除しました')
    } finally {
      setPinWorking(false)
    }
  }

  const handleSave = () => {
    if (!facility) return
    if (!form.name.trim()) {
      toast.error('施設名を入力してください')
      return
    }
    setFacility({
      ...facility,
      name: form.name.trim(),
      director_name: form.director_name || null,
      address: form.address || null,
      phone: form.phone || null,
      capacity: Number(form.capacity) || null,
      staff_count: Number(form.staff_count) || null,
    })
    toast.success('設定を保存しました')
  }

  const handleCopyCode = () => {
    if (!facility?.code) return
    navigator.clipboard.writeText(facility.code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const handlePublishCode = async () => {
    if (!facility || !isSupabaseConfigured) return
    setPublishingCode(true)
    try {
      const result = await createFacilityInSupabase(
        facility.name,
        facility.director_name,
        facility.phone,
        facility.pinHash ?? null,
      )
      if (result) {
        setFacility({
          ...facility,
          id: result.id,
          supabaseId: result.id,
          code: result.code,
        })
        // PINが設定されている場合、新しいIDでもセッション認証済みとしてマーク
        if (facility.pinHash) markPINVerified(result.id)
        toast.success(`施設コード「${result.code}」を発行しました`)
      } else {
        toast.error('コードの発行に失敗しました。ネットワークを確認してください')
      }
    } finally {
      setPublishingCode(false)
    }
  }

  const Field: React.FC<{
    label: string
    name: keyof typeof form
    type?: string
    placeholder?: string
  }> = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm
                   focus:ring-2 focus:ring-blue-500 focus:outline-none
                   min-h-[44px] break-anywhere"
      />
    </div>
  )

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 施設情報 */}
      <div>
        <SectionHeader
          title="施設情報"
          subtitle="安全計画や報告書に使用される情報です"
        />
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-blue-500" />
            <p className="text-sm font-semibold text-gray-800">基本情報</p>
          </div>
          <Field label="施設名 *" name="name" placeholder="さくら保育園" />
          <Field label="施設長名" name="director_name" placeholder="山田 花子" />
          <Field label="住所" name="address" placeholder="沖縄県南城市○○1-2-3" />
          <Field label="電話番号" name="phone" type="tel" placeholder="098-000-0000" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="定員（人）" name="capacity" type="number" placeholder="60" />
            <Field label="職員数（人）" name="staff_count" type="number" placeholder="12" />
          </div>
          <Button variant="primary" fullWidth onClick={handleSave}>
            <Save size={16} />
            保存する
          </Button>
        </Card>
      </div>

      {/* マルチデバイス */}
      <div>
        <SectionHeader
          title="複数端末で共有（マルチデバイス）"
          subtitle="施設コードをスタッフに共有すると、それぞれの端末で同じデータを使えます"
        />
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone size={16} className="text-blue-500" />
            <p className="text-sm font-semibold text-gray-800">施設コード</p>
          </div>

          {facility?.code ? (
            <>
              {/* コード表示 */}
              <div className="bg-blue-50 rounded-xl p-4 text-center space-y-2">
                <p className="text-xs text-blue-600 font-medium">この端末の施設コード</p>
                <p className="text-4xl font-bold tracking-widest text-blue-700 font-mono">
                  {facility.code}
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyCode}
                  >
                    {codeCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {codeCopied ? 'コピーしました' : 'コードをコピー'}
                  </Button>
                </div>
              </div>
              {/* 使い方 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">スタッフの端末での参加方法</p>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>スタッフの端末でアプリを開く</li>
                  <li>「コードで参加」タブを選ぶ</li>
                  <li>このコード（<span className="font-mono font-bold">{facility.code}</span>）を入力して参加</li>
                </ol>
              </div>
              <p className="text-xs text-gray-400">
                ※ 記録した内容はリアルタイムで全端末に同期されます
              </p>
            </>
          ) : isSupabaseConfigured ? (
            <>
              <p className="text-sm text-gray-600">
                施設コードを発行すると、スタッフの端末でもデータを共有できます。
              </p>
              <Button
                variant="primary"
                fullWidth
                loading={publishingCode}
                onClick={handlePublishCode}
              >
                <RefreshCw size={16} />
                施設コードを発行する
              </Button>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">
                クラウド接続が設定されていません。<br />
                環境変数を確認してください。
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* PINコード認証 */}
      <div>
        <SectionHeader
          title="PINコード認証"
          subtitle="アプリ起動時にPINの入力を求めることで、第三者によるアクセスを防止します"
        />
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-blue-500" />
            <p className="text-sm font-semibold text-gray-800">PINコード</p>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
              facility?.pinHash ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {facility?.pinHash ? '設定済み' : '未設定'}
            </span>
          </div>

          {/* フォームなし（表示のみ） */}
          {pinAction === null && (
            <>
              {facility?.pinHash ? (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" fullWidth onClick={() => { setPinAction('change-verify'); setPinVal(''); setPinError(null) }}>
                    変更する
                  </Button>
                  <Button variant="danger" size="sm" fullWidth onClick={() => { setPinAction('remove-verify'); setPinVal(''); setPinError(null) }}>
                    削除する
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" fullWidth onClick={() => { setPinAction('set'); setPinVal(''); setPinConfirmVal(''); setPinError(null) }}>
                  <Lock size={15} />
                  PINを設定する
                </Button>
              )}
            </>
          )}

          {/* PIN新規設定フォーム */}
          {pinAction === 'set' && (
            <div className="space-y-3">
              <PINField label="新しいPIN（4〜8桁）" value={pinVal} onChange={setPinVal} show={showPin} onToggleShow={() => setShowPin(v => !v)} error={null} />
              <PINField label="PINの確認" value={pinConfirmVal} onChange={setPinConfirmVal} show={showPin} onToggleShow={() => setShowPin(v => !v)} error={pinError} />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" fullWidth loading={pinWorking} onClick={handleSetPIN}>設定する</Button>
                <Button variant="secondary" size="sm" onClick={resetPINForm}><X size={14} /></Button>
              </div>
            </div>
          )}

          {/* 変更：現PIN確認フォーム */}
          {pinAction === 'change-verify' && (
            <div className="space-y-3">
              <PINField label="現在のPIN" value={pinVal} onChange={setPinVal} show={showPin} onToggleShow={() => setShowPin(v => !v)} error={pinError} autoFocus />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" fullWidth loading={pinWorking} onClick={handleVerifyCurrentForChange}>確認する</Button>
                <Button variant="secondary" size="sm" onClick={resetPINForm}><X size={14} /></Button>
              </div>
            </div>
          )}

          {/* 変更：新PIN入力フォーム */}
          {pinAction === 'change-new' && (
            <div className="space-y-3">
              <PINField label="新しいPIN（4〜8桁）" value={pinVal} onChange={setPinVal} show={showPin} onToggleShow={() => setShowPin(v => !v)} error={null} autoFocus />
              <PINField label="PINの確認" value={pinConfirmVal} onChange={setPinConfirmVal} show={showPin} onToggleShow={() => setShowPin(v => !v)} error={pinError} />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" fullWidth loading={pinWorking} onClick={handleChangePIN}>変更する</Button>
                <Button variant="secondary" size="sm" onClick={resetPINForm}><X size={14} /></Button>
              </div>
            </div>
          )}

          {/* 削除：現PIN確認フォーム */}
          {pinAction === 'remove-verify' && (
            <div className="space-y-3">
              <p className="text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">削除するには現在のPINを入力してください</p>
              <PINField label="現在のPIN" value={pinVal} onChange={setPinVal} show={showPin} onToggleShow={() => setShowPin(v => !v)} error={pinError} autoFocus />
              <div className="flex gap-2">
                <Button variant="danger" size="sm" fullWidth loading={pinWorking} onClick={handleVerifyCurrentForRemove}>削除する</Button>
                <Button variant="secondary" size="sm" onClick={resetPINForm}><X size={14} /></Button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            ※ PINはこの端末のみに保存され、タブを閉じると再度入力が必要です
          </p>
        </Card>
      </div>

      {/* バックアップ・復元 */}
      <div>
        <SectionHeader
          title="データのバックアップ・復元"
          subtitle="万が一データが消えた場合に備えて、定期的にバックアップを保存してください"
        />
        <Card className="p-5 space-y-4">
          {/* バックアップ */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">バックアップを保存する</p>
            <p className="text-xs text-gray-500 mb-3">
              チェック表・年間カレンダー・ヒヤリハットなど全データをJSONファイルとしてダウンロードします
            </p>
            <Button variant="primary" fullWidth onClick={() => { exportBackup(); toast.success('バックアップファイルを保存しました') }}>
              <Download size={16} />
              バックアップをダウンロード
            </Button>
          </div>

          <hr className="border-gray-100" />

          {/* 復元 */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">バックアップから復元する</p>
            <p className="text-xs text-gray-500 mb-3">
              以前保存したJSONファイルを選択すると、データが復元されます。<br />
              <span className="text-orange-600 font-medium">※ 現在のデータは上書きされます</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) { setPendingFile(file); setRestoreConfirm(true) }
                e.target.value = ''
              }}
            />
            {restoreConfirm && pendingFile ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    「{pendingFile.name}」から復元します。<br />現在のデータはすべて上書きされますがよろしいですか？
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" fullWidth onClick={() => {
                    importBackup(
                      pendingFile,
                      (failedKeys) => {
                        if (failedKeys.length > 0) {
                          toast.error(`一部のデータを復元できませんでした（ストレージ容量不足）。ページを再読み込みします`)
                        } else {
                          toast.success('復元しました。ページを再読み込みします')
                        }
                        setTimeout(() => location.reload(), 1500)
                      },
                      () => { toast.error('ファイルの読み込みに失敗しました') }
                    )
                    setRestoreConfirm(false); setPendingFile(null)
                  }}>
                    復元する
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setRestoreConfirm(false); setPendingFile(null) }}>
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                バックアップファイルを選択
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* ヒヤリハットマップ ゾーン管理 */}
      <div>
        <SectionHeader
          title="ヒヤリハットマップ ゾーン管理"
          subtitle="マップに表示するゾーンをカスタマイズできます"
        />
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Map size={16} className="text-blue-500" />
            <p className="text-sm font-semibold text-gray-800">ゾーン設定</p>
          </div>
          <ZoneManager />
        </Card>
      </div>

      {/* その他設定（将来用） */}
      <div>
        <SectionHeader title="その他の設定" />
        <div className="space-y-2">
          {[
            { icon: <Bell size={16} />, label: '通知設定', sub: '未実施アラートのタイミング' },
            { icon: <Users size={16} />, label: '職員管理', sub: 'メンバーの追加・役割変更' },
            { icon: <Shield size={16} />, label: 'ヒヤリハット連携', sub: '準備中 - 別システムとの連携' },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 break-anywhere">{item.sub}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* アプリ情報 */}
      <Card className="p-4">
        <p className="text-xs text-gray-400 text-center">
          安全計画 使える化サポート<br />
          Version 1.0.0（MVP）
        </p>
      </Card>

      <div className="h-4" />
    </div>
  )
}

export default Settings
