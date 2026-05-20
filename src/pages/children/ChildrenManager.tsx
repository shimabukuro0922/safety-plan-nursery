import React, { useState } from 'react'
import { Users, Plus, Pencil, Trash2, ShieldAlert, ShieldCheck, X, Check } from 'lucide-react'
import { Card, SectionHeader, Button, Modal, EmptyState } from '@/components/ui'
import { useChildrenStore } from '@/stores/childrenStore'
import type { Child } from '@/stores/childrenStore'
import { useFacilityStore } from '@/stores/facilityStore'
import toast from 'react-hot-toast'

// ==============================
// 子ども追加・編集フォーム
// ==============================
const ChildForm: React.FC<{
  initial?: Partial<Child>
  onSave: (data: Omit<Child, 'id' | 'createdAt'>) => void
  onCancel: () => void
}> = ({ initial, onSave, onCancel }) => {
  const { classes } = useChildrenStore()
  const [name, setName] = useState(initial?.name ?? '')
  const [className, setClassName] = useState(initial?.className ?? classes[3] ?? '')
  const [isPhotoNG, setIsPhotoNG] = useState(initial?.isPhotoNG ?? false)
  const [ngReason, setNgReason] = useState(initial?.ngReason ?? '')

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('お子さんの名前を入力してください'); return }
    if (!className) { toast.error('クラスを選択してください'); return }
    onSave({
      name: name.trim(),
      className,
      isPhotoNG,
      ngReason: isPhotoNG ? (ngReason.trim() || '保護者申請') : null,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">お子さんの名前 *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：山田 太郎"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">クラス *</label>
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
        >
          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPhotoNG}
            onChange={(e) => setIsPhotoNG(e.target.checked)}
            className="w-4 h-4 rounded accent-red-500"
          />
          <span className="text-sm font-medium text-gray-800">📷 写真掲載NG</span>
        </label>
        {isPhotoNG && (
          <div className="mt-2 ml-6">
            <input
              value={ngReason}
              onChange={(e) => setNgReason(e.target.value)}
              placeholder="理由（例：保護者申請、DVシェルター等）"
              className="w-full border border-red-200 bg-red-50 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
            <p className="text-xs text-red-500 mt-1">この子が写っている写真には赤枠警告が表示されます</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="primary" fullWidth size="sm" onClick={handleSubmit}>
          <Check size={14} /> 保存
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          <X size={14} /> キャンセル
        </Button>
      </div>
    </div>
  )
}

// ==============================
// 園児カード
// ==============================
const ChildCard: React.FC<{
  child: Child
  onEdit: () => void
  onDelete: () => void
}> = ({ child, onEdit, onDelete }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-base font-bold
        ${child.isPhotoNG ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
        {child.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 break-anywhere">{child.name}</p>
          {child.isPhotoNG && (
            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              <ShieldAlert size={10} /> 写真NG
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{child.className}</p>
        {child.isPhotoNG && child.ngReason && (
          <p className="text-xs text-red-500 mt-0.5 break-anywhere">{child.ngReason}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-emerald-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </Card>
)

// ==============================
// メインページ
// ==============================
export const ChildrenManager: React.FC = () => {
  const { children, addChild, updateChild, deleteChild } = useChildrenStore()
  const { facility } = useFacilityStore()
  const isSynced = !!facility?.supabaseId
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filterClass, setFilterClass] = useState('')

  const classes = [...new Set(children.map((c) => c.className))].sort()
  const filtered = filterClass ? children.filter((c) => c.className === filterClass) : children
  const ngCount = children.filter((c) => c.isPhotoNG).length
  const editTarget = editId ? children.find((c) => c.id === editId) : undefined

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="園児管理"
        subtitle="写真掲載NG設定はここで管理します"
      />

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <Users size={20} className="text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{children.length}</p>
          <p className="text-xs text-gray-500">登録園児数</p>
        </Card>
        <Card className={`p-4 text-center ${ngCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <ShieldAlert size={20} className={`mx-auto mb-1 ${ngCount > 0 ? 'text-red-500' : 'text-gray-300'}`} />
          <p className={`text-2xl font-bold ${ngCount > 0 ? 'text-red-700' : 'text-gray-300'}`}>{ngCount}</p>
          <p className="text-xs text-gray-500">写真NG</p>
        </Card>
      </div>

      {/* 追加ボタン */}
      <Button variant="primary" fullWidth onClick={() => setAddOpen(true)}>
        <Plus size={16} /> 園児を追加する
      </Button>

      {/* クラスフィルター */}
      {classes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterClass('')}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!filterClass ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            全クラス
          </button>
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => setFilterClass(c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterClass === c ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 写真NGの注意 */}
      {ngCount > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">写真掲載NG設定 {ngCount}名</p>
              <p className="text-xs text-red-700 mt-0.5">
                写真アップロード時にNG園児が検出されると赤枠警告が表示されます。<br />
                承認画面でも必ず確認してください。
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 園児一覧 */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="園児が登録されていません"
          description="「園児を追加する」ボタンから登録してください"
          action={{ label: '園児を追加する', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onEdit={() => setEditId(child.id)}
              onDelete={() => {
                if (window.confirm(`${child.name}さんを削除しますか？`)) {
                  deleteChild(child.id)
                  toast.success('削除しました')
                }
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            {isSynced
              ? '園児情報は施設コードで参加した端末間で自動的に同期されます。'
              : '施設コードを発行すると、複数端末で園児情報を共有できます。'}
            <br />
            写真掲載NG設定は写真管理・保護者共有のすべての場面で自動的に適用されます。
          </p>
        </div>
      </div>

      <div className="h-4" />

      {/* 追加モーダル */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="園児を追加">
        <ChildForm
          onSave={(data) => {
            addChild(data)
            setAddOpen(false)
            toast.success('園児を登録しました')
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* 編集モーダル */}
      <Modal open={!!editId} onClose={() => setEditId(null)} title="園児情報を編集">
        {editTarget && (
          <ChildForm
            initial={editTarget}
            onSave={(data) => {
              updateChild(editTarget.id, data)
              setEditId(null)
              toast.success('更新しました')
            }}
            onCancel={() => setEditId(null)}
          />
        )}
      </Modal>
    </div>
  )
}

export default ChildrenManager
