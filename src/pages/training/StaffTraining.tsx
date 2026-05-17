import React, { useState } from 'react'
import { GraduationCap, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, X, Check } from 'lucide-react'
import { Card, SectionHeader, Button } from '@/components/ui'
import { useStaffTrainingStore } from '@/stores/appStore'
import type { TrainingRecord } from '@/stores/appStore'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TRAINING_TYPES = [
  '救命救急講習（心肺蘇生・AED）',
  'アレルギー・エピペン研修',
  '防災・避難訓練',
  '不審者対応訓練',
  '保育安全研修',
  '感染症対策研修',
  'リスクマネジメント研修',
  '食育・誤嚥防止研修',
]

const getExpiryStatus = (expiryDate: string | null) => {
  if (!expiryDate) return { label: '期限なし', color: 'bg-gray-100 text-gray-500', urgent: false }
  const days = differenceInDays(parseISO(expiryDate), new Date())
  if (days < 0) return { label: `${Math.abs(days)}日超過`, color: 'bg-red-100 text-red-700', urgent: true }
  if (days <= 30) return { label: `あと${days}日`, color: 'bg-orange-100 text-orange-700', urgent: true }
  if (days <= 90) return { label: `あと${days}日`, color: 'bg-yellow-100 text-yellow-700', urgent: false }
  return { label: format(parseISO(expiryDate), 'yyyy年M月', { locale: ja }), color: 'bg-green-100 text-green-700', urgent: false }
}

// ==============================
// 追加フォーム
// ==============================
const AddForm: React.FC<{ onAdd: (r: Omit<TrainingRecord, 'id'>) => void; onCancel: () => void }> = ({ onAdd, onCancel }) => {
  const [staffName, setStaffName] = useState('')
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0])
  const [customType, setCustomType] = useState('')
  const [completedDate, setCompletedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!staffName.trim()) { toast.error('職員名を入力してください'); return }
    const type = trainingType === 'custom' ? customType.trim() : trainingType
    if (!type) { toast.error('研修名を入力してください'); return }
    onAdd({
      staff_name: staffName.trim(),
      training_type: type,
      completed_date: completedDate,
      expiry_date: expiryDate || null,
      notes: notes.trim() || null,
    })
  }

  return (
    <Card className="p-4 border-blue-200 bg-blue-50 space-y-3">
      <p className="text-sm font-bold text-gray-900">研修記録を追加</p>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">職員名 *</label>
        <input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="例：山田 花子"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">研修・資格の種類 *</label>
        <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
          {TRAINING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value="custom">その他（直接入力）</option>
        </select>
        {trainingType === 'custom' && (
          <input value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="研修名を入力"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white mt-1.5" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">受講日 *</label>
          <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">有効期限（任意）</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">メモ（任意）</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="実施機関・修了証番号など"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" />
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" fullWidth onClick={handleSubmit}>
          <Check size={14} /> 追加する
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          <X size={14} /> キャンセル
        </Button>
      </div>
    </Card>
  )
}

// ==============================
// メインページ
// ==============================
export const StaffTraining: React.FC = () => {
  const { records, addRecord, deleteRecord } = useStaffTrainingStore()
  const [showForm, setShowForm] = useState(false)
  const [filterStaff, setFilterStaff] = useState('')

  const urgent = records.filter((r) => {
    if (!r.expiry_date) return false
    const days = differenceInDays(parseISO(r.expiry_date), new Date())
    return days <= 30
  })

  const staffNames = [...new Set(records.map((r) => r.staff_name))].sort()
  const filtered = filterStaff
    ? records.filter((r) => r.staff_name === filterStaff)
    : records
  const sorted = [...filtered].sort((a, b) => b.completed_date.localeCompare(a.completed_date))

  const handleAdd = (data: Omit<TrainingRecord, 'id'>) => {
    addRecord(data)
    setShowForm(false)
    toast.success('研修記録を追加しました')
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="職員研修・資格管理"
        subtitle="受講記録と有効期限を一覧管理します"
      />

      {/* 期限アラート */}
      {urgent.length > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-800">期限切れ・期限間近の資格があります</p>
              <div className="mt-1 space-y-0.5">
                {urgent.map((r) => (
                  <p key={r.id} className="text-xs text-orange-700 break-anywhere">
                    · {r.staff_name}：{r.training_type}
                    （{getExpiryStatus(r.expiry_date).label}）
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 追加ボタン / フォーム */}
      {showForm ? (
        <AddForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 rounded-xl text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors min-h-[52px]"
        >
          <Plus size={16} /> 研修記録を追加する
        </button>
      )}

      {/* 職員フィルター */}
      {staffNames.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStaff('')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!filterStaff ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            全員
          </button>
          {staffNames.map((name) => (
            <button key={name} onClick={() => setFilterStaff(name)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterStaff === name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* 記録一覧 */}
      {sorted.length === 0 ? (
        <Card className="p-8 text-center">
          <GraduationCap size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">研修記録がありません</p>
          <p className="text-xs text-gray-400 mt-1">「研修記録を追加する」から登録してください</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => {
            const status = getExpiryStatus(r.expiry_date)
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <GraduationCap size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 break-anywhere">{r.staff_name}</p>
                        <p className="text-xs text-gray-600 break-anywhere mt-0.5">{r.training_type}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.urgent && <AlertTriangle size={10} className="inline mr-0.5" />}
                          {status.label}
                        </span>
                        <button onClick={() => { if (window.confirm(`「${r.staff_name}」の「${r.training_type}」を削除しますか？`)) { deleteRecord(r.id); toast.success('削除しました') } }}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle2 size={11} className="text-green-500" />
                        受講: {format(parseISO(r.completed_date), 'yyyy年M月d日', { locale: ja })}
                      </span>
                      {r.expiry_date && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />
                          期限: {format(parseISO(r.expiry_date), 'yyyy年M月d日', { locale: ja })}
                        </span>
                      )}
                    </div>
                    {r.notes && <p className="text-xs text-gray-400 mt-1 break-anywhere">{r.notes}</p>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

export default StaffTraining
