import React, { useState, useRef } from 'react'
import { Building2, Save, ChevronRight, Shield, Bell, Users, Download, Upload, AlertTriangle, Smartphone, Copy, Check, RefreshCw } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import { createFacilityInSupabase } from '@/lib/sync'
import { isSupabaseConfigured } from '@/lib/supabase'
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

function importBackup(file: File, onSuccess: () => void, onError: () => void) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as Record<string, string>
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
      onSuccess()
    } catch {
      onError()
    }
  }
  reader.readAsText(file)
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

  const handleSave = () => {
    if (!facility) return
    setFacility({
      ...facility,
      name: form.name,
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
      )
      if (result) {
        setFacility({
          ...facility,
          id: result.id,
          supabaseId: result.id,
          code: result.code,
        })
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
                      () => { toast.success('復元しました。ページを再読み込みします'); setTimeout(() => location.reload(), 1000) },
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
