import React, { useState } from 'react'
import { Building2, Save, ChevronRight, Shield, Bell, Users } from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useFacilityStore } from '@/stores/facilityStore'
import toast from 'react-hot-toast'

export const Settings: React.FC = () => {
  const { facility, setFacility } = useFacilityStore()
  const [form, setForm] = useState({
    name: facility?.name ?? '',
    director_name: facility?.director_name ?? '',
    address: facility?.address ?? '',
    phone: facility?.phone ?? '',
    capacity: String(facility?.capacity ?? ''),
    staff_count: String(facility?.staff_count ?? ''),
  })

  const handleSave = () => {
    setFacility({
      ...facility!,
      name: form.name,
      director_name: form.director_name || null,
      address: form.address || null,
      phone: form.phone || null,
      capacity: Number(form.capacity) || null,
      staff_count: Number(form.staff_count) || null,
    })
    toast.success('設定を保存しました')
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
