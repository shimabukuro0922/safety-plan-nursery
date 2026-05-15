import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Camera, CheckCircle2, XCircle, Clock, ShieldAlert, X,
  ChevronLeft, ChevronRight, RotateCcw, Trash2, Tag, Check,
} from 'lucide-react'
import { Card, SectionHeader, Button, Modal } from '@/components/ui'
import { usePhotoStore } from '@/stores/photoStore'
import type { PhotoMeta, PhotoStatus } from '@/stores/photoStore'
import { useChildrenStore } from '@/stores/childrenStore'
import { loadPhotoURL, deletePhoto as deletePhotoFromDB } from '@/lib/photoDB'
import { deletePhotoFromSupabase } from '@/lib/photoStorage'
import { useFacilityStore } from '@/stores/facilityStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<PhotoStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: '確認待ち', color: 'bg-orange-100 text-orange-700', icon: <Clock size={12} /> },
  approved: { label: '承認済み', color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={12} /> },
  rejected: { label: '却下',     color: 'bg-gray-100 text-gray-500',    icon: <XCircle size={12} /> },
}

// ==============================
// 詳細モーダル
// ==============================
const PhotoDetailModal: React.FC<{
  photo: PhotoMeta | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}> = ({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const { events, approvePhoto, rejectPhoto, resetToPending, updatePhoto, deletePhoto } = usePhotoStore()
  const { children } = useChildrenStore()
  const { facility } = useFacilityStore()
  const [fullUrl, setFullUrl] = useState<string | null>(null)
  const [loadingFull, setLoadingFull] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  // object URL のメモリリーク防止: ref でクリーンアップ時に確実に revoke する
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    // 前の写真の URL を解放
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setFullUrl(null)
    setTagOpen(false)
    setShowRejectInput(false)
    setRejectReason('')
    if (!photo) return

    setLoadingFull(true)
    loadPhotoURL(photo.id, photo.storageUrl).then((url) => {
      urlRef.current = url
      setFullUrl(url)
      setLoadingFull(false)
    }).catch(() => setLoadingFull(false))

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [photo?.id])

  if (!photo) return null

  const ev = events.find((e) => e.id === photo.eventId)
  const taggedChildren = children.filter((c) => photo.taggedChildIds.includes(c.id))
  const ngChildren = taggedChildren.filter((c) => c.isPhotoNG)

  const handleTagToggle = (childId: string) => {
    const current = photo.taggedChildIds
    const next = current.includes(childId) ? current.filter((id) => id !== childId) : [...current, childId]
    const hasNG = children.some((c) => c.isPhotoNG && next.includes(c.id))
    updatePhoto(photo.id, { taggedChildIds: next, hasNGChild: hasNG })
  }

  const handleApprove = () => {
    if (photo.hasNGChild) {
      toast.error('写真NG園児が含まれています。承認できません。')
      return
    }
    approvePhoto(photo.id)
    toast.success('承認しました')
    // onNext() ではなく onClose(): フィルター絞り込み時にインデックスがずれるバグを防ぐ
    onClose()
  }

  const handleReject = () => {
    if (!showRejectInput) { setShowRejectInput(true); return }
    rejectPhoto(photo.id, rejectReason || undefined)
    setShowRejectInput(false)
    toast.success('却下しました')
    onClose()
  }

  const handleDelete = () => {
    if (!window.confirm('この写真を削除しますか？元に戻せません。')) return
    // IndexedDB から削除
    deletePhotoFromDB(photo.id)
    // Supabase Storage からも削除（クラウドに保存されている場合）
    if (photo.storageUrl && facility?.supabaseId) {
      deletePhotoFromSupabase(photo.id, facility.supabaseId)
    }
    deletePhoto(photo.id)
    toast.success('削除しました')
    onClose()
  }

  const statusCfg = STATUS_CONFIG[photo.status]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-3 bg-black/60">
        <button onClick={onClose} className="p-2 text-white"><X size={20} /></button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{ev?.name ?? 'イベント不明'}</p>
          <p className="text-xs text-gray-400">{photo.filename}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
          {statusCfg.icon}{statusCfg.label}
        </span>
        <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-400">
          <Trash2 size={16} />
        </button>
      </div>

      {/* 写真 */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-10">
        {hasPrev && (
          <button onClick={onPrev} className="absolute left-2 p-3 text-white bg-black/40 rounded-full hover:bg-black/60">
            <ChevronLeft size={20} />
          </button>
        )}
        {loadingFull && !photo.thumbnailDataUrl && (
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        )}
        <img
          src={fullUrl ?? photo.thumbnailDataUrl}
          alt={photo.filename}
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{ filter: photo.hasNGChild ? 'brightness(0.6)' : 'none' }}
        />
        {photo.hasNGChild && (
          <div className="absolute inset-10 border-4 border-red-500 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="bg-red-600/80 text-white text-sm font-bold px-4 py-2 rounded-xl">
              ⚠️ 写真NG園児が含まれています
            </div>
          </div>
        )}
        {hasNext && (
          <button onClick={onNext} className="absolute right-2 p-3 text-white bg-black/40 rounded-full hover:bg-black/60">
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* 下部パネル */}
      <div className="bg-white rounded-t-2xl px-4 pt-4 pb-6 space-y-3 max-h-[50vh] overflow-y-auto">
        {/* NGアラート */}
        {ngChildren.length > 0 && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800">写真NG：{ngChildren.map((c) => c.name).join('・')}</p>
              <p className="text-xs text-red-600 mt-0.5">この写真は承認できません。却下または削除してください。</p>
            </div>
          </div>
        )}

        {/* タグ表示 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-gray-600">写っている子ども</p>
            <button onClick={() => setTagOpen((v) => !v)} className="text-xs text-blue-600 flex items-center gap-1">
              <Tag size={11} /> 編集
            </button>
          </div>
          {taggedChildren.length === 0 ? (
            <p className="text-xs text-gray-400">まだタグ付けされていません</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {taggedChildren.map((child) => (
                <span
                  key={child.id}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${child.isPhotoNG ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                >
                  {child.isPhotoNG && '⚠️ '}{child.name}
                </span>
              ))}
            </div>
          )}

          {/* タグ編集 */}
          {tagOpen && (
            <div className="mt-2 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
              {children.length === 0 ? (
                <p className="text-xs text-gray-400">園児が登録されていません（園児管理で追加してください）</p>
              ) : (
                children.map((child) => (
                  <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photo.taggedChildIds.includes(child.id)}
                      onChange={() => handleTagToggle(child.id)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-gray-800 flex-1 break-anywhere">{child.name}</span>
                    <span className="text-xs text-gray-400">{child.className}</span>
                    {child.isPhotoNG && <ShieldAlert size={12} className="text-red-500 shrink-0" />}
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        {photo.status === 'pending' && (
          <div className="space-y-2">
            <Button
              variant="primary"
              fullWidth
              size="sm"
              onClick={handleApprove}
              disabled={photo.hasNGChild}
            >
              <Check size={14} />
              {photo.hasNGChild ? '写真NGのため承認不可' : 'この写真を承認する'}
            </Button>
            {showRejectInput ? (
              <div className="space-y-2">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="却下理由（任意）"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="danger" fullWidth size="sm" onClick={handleReject}>
                    <XCircle size={14} /> 却下する
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowRejectInput(false)}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" fullWidth size="sm" onClick={handleReject}>
                <XCircle size={14} /> 却下する
              </Button>
            )}
          </div>
        )}
        {photo.status === 'approved' && (
          <Button variant="secondary" fullWidth size="sm" onClick={() => { resetToPending(photo.id); toast.success('確認待ちに戻しました') }}>
            <RotateCcw size={14} /> 確認待ちに戻す
          </Button>
        )}
        {photo.status === 'rejected' && (
          <div className="space-y-2">
            {photo.rejectedReason && <p className="text-xs text-gray-500">却下理由：{photo.rejectedReason}</p>}
            <Button variant="secondary" fullWidth size="sm" onClick={() => { resetToPending(photo.id); toast.success('確認待ちに戻しました') }}>
              <RotateCcw size={14} /> 再確認する
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ==============================
// ギャラリーページ
// ==============================
export const PhotoGallery: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialFilter = (searchParams.get('filter') ?? 'all') as 'all' | 'pending' | 'approved' | 'rejected' | 'ng'
  const initialEventId = searchParams.get('eventId') ?? ''

  const { photos, events } = usePhotoStore()
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'ng'>(initialFilter)
  const [filterEventId, setFilterEventId] = useState(initialEventId)
  // インデックスではなくIDで追跡することでフィルター変化時のズレを防ぐ
  const [detailPhotoId, setDetailPhotoId] = useState<string | null>(null)

  const filtered = photos.filter((p) => {
    if (filterStatus === 'ng') return p.hasNGChild && p.status !== 'rejected'
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterEventId && p.eventId !== filterEventId) return false
    return true
  })

  const FILTER_TABS = [
    { key: 'all',      label: `全て (${photos.length})` },
    { key: 'pending',  label: `確認待ち (${photos.filter((p) => p.status === 'pending').length})` },
    { key: 'approved', label: `承認済み (${photos.filter((p) => p.status === 'approved').length})` },
    { key: 'rejected', label: `却下 (${photos.filter((p) => p.status === 'rejected').length})` },
    { key: 'ng',       label: `NG (${photos.filter((p) => p.hasNGChild).length})` },
  ] as const

  const currentPhoto = detailPhotoId !== null ? (filtered.find((p) => p.id === detailPhotoId) ?? null) : null
  const detailIndex = detailPhotoId !== null ? filtered.findIndex((p) => p.id === detailPhotoId) : -1

  return (
    <div className="px-4 py-6 space-y-4">
      <SectionHeader
        title="写真ギャラリー"
        subtitle="タップして確認・承認・タグ付けができます"
      />

      {/* ステータスフィルター */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key as typeof filterStatus)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors shrink-0 font-medium
              ${filterStatus === tab.key
                ? tab.key === 'ng' ? 'bg-red-600 text-white border-red-600'
                  : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* イベントフィルター */}
      {events.length > 1 && (
        <select
          value={filterEventId}
          onChange={(e) => setFilterEventId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option value="">全イベント</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}（{ev.date}）</option>
          ))}
        </select>
      )}

      {/* グリッド */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Camera size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-500">写真がありません</p>
        </Card>
      ) : (
        <>
          <p className="text-xs text-gray-500">{filtered.length}枚表示中</p>
          <div className="grid grid-cols-3 gap-1.5">
            {filtered.map((photo, i) => {
              const statusCfg = STATUS_CONFIG[photo.status]
              return (
                <button
                  key={photo.id}
                  onClick={() => setDetailPhotoId(photo.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-opacity hover:opacity-90
                    ${photo.hasNGChild ? 'border-red-500' : photo.status === 'approved' ? 'border-green-400' : 'border-transparent'}`}
                >
                  {photo.thumbnailDataUrl ? (
                    <img src={photo.thumbnailDataUrl} alt={photo.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Camera size={20} className="text-gray-300" />
                    </div>
                  )}
                  {/* ステータスバッジ */}
                  <div className={`absolute bottom-1 left-1 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </div>
                  {/* NGオーバーレイ */}
                  {photo.hasNGChild && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5">
                      <ShieldAlert size={10} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="h-4" />

      {/* 詳細モーダル */}
      {currentPhoto && (
        <PhotoDetailModal
          photo={currentPhoto}
          onClose={() => setDetailPhotoId(null)}
          onPrev={() => {
            if (detailIndex > 0) setDetailPhotoId(filtered[detailIndex - 1].id)
          }}
          onNext={() => {
            if (detailIndex !== -1 && detailIndex < filtered.length - 1)
              setDetailPhotoId(filtered[detailIndex + 1].id)
            else setDetailPhotoId(null)
          }}
          hasPrev={detailIndex > 0}
          hasNext={detailIndex !== -1 && detailIndex < filtered.length - 1}
        />
      )}
    </div>
  )
}

export default PhotoGallery
