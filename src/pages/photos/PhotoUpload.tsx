import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Plus, Camera, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, SectionHeader, Button } from '@/components/ui'
import { usePhotoStore } from '@/stores/photoStore'
import { useChildrenStore } from '@/stores/childrenStore'
import type { Child } from '@/stores/childrenStore'
import { useFacilityStore } from '@/stores/facilityStore'
import { savePhoto, makeThumbnail } from '@/lib/photoDB'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface PreviewItem {
  file: File
  objectUrl: string
  thumbnail: string
  taggedChildIds: string[]
  hasNGChild: boolean
}

// ==============================
// 写真1枚のプレビューカード
// ==============================
const PhotoPreviewCard: React.FC<{
  item: PreviewItem
  index: number
  childList: Child[]
  onTagChildren: (ids: string[]) => void
  onRemove: () => void
}> = ({ item, index, childList, onTagChildren, onRemove }) => {
  const [expanded, setExpanded] = useState(false)

  const handleToggleChild = (childId: string) => {
    const current = item.taggedChildIds
    const next = current.includes(childId)
      ? current.filter((id) => id !== childId)
      : [...current, childId]
    onTagChildren(next)
  }

  return (
    <Card className={`overflow-hidden ${item.hasNGChild ? 'border-2 border-red-500' : ''}`}>
      {/* サムネイル */}
      <div className="relative">
        <div className="aspect-square bg-gray-100">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={`preview-${index}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera size={24} className="text-gray-300" />
            </div>
          )}
        </div>
        {/* NG警告 */}
        {item.hasNGChild && (
          <div className="absolute inset-0 border-4 border-red-500 bg-red-500/10 flex items-end p-1">
            <div className="w-full bg-red-600 text-white text-xs font-bold text-center py-0.5 rounded">
              ⚠️ 写真NG
            </div>
          </div>
        )}
        {/* 削除ボタン */}
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
        >
          <X size={12} />
        </button>
      </div>

      {/* ファイル名 */}
      <div className="px-2 py-1.5">
        <p className="text-[10px] text-gray-500 truncate">{item.file.name}</p>

        {/* 子どもタグ付け */}
        {childList.length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-blue-600 font-medium"
            >
              {item.taggedChildIds.length > 0
                ? `${item.taggedChildIds.length}名タグ付き`
                : 'だれが写ってる？'}
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {expanded && (
              <div className="mt-1 max-h-28 overflow-y-auto space-y-0.5">
                {childList.map((child) => (
                  <label key={child.id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.taggedChildIds.includes(child.id)}
                      onChange={() => handleToggleChild(child.id)}
                      className="w-3 h-3 accent-blue-500"
                    />
                    <span className="text-[10px] text-gray-700 break-anywhere flex-1">{child.name}</span>
                    {child.isPhotoNG && (
                      <ShieldAlert size={10} className="text-red-500 shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ==============================
// アップロードページ
// ==============================
export const PhotoUpload: React.FC = () => {
  const navigate = useNavigate()
  const { facility } = useFacilityStore()
  const { events, addEvent, addPhoto } = usePhotoStore()
  const { children, classes } = useChildrenStore()

  // イベント選択
  const [useExistingEvent, setUseExistingEvent] = useState(events.length > 0)
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newEventClass, setNewEventClass] = useState('')
  const [newEventNotes, setNewEventNotes] = useState('')

  // 写真プレビュー
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ドラッグ&ドロップ
  const [dragging, setDragging] = useState(false)

  // アンマウント時に未解放の object URL をすべて revoke する
  const previewsRef = useRef<PreviewItem[]>([])
  previewsRef.current = previews
  useEffect(() => {
    return () => { previewsRef.current.forEach((p) => URL.revokeObjectURL(p.objectUrl)) }
  }, [])

  const processFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) { toast.error('画像ファイルを選択してください'); return }

    const items: PreviewItem[] = await Promise.all(
      imageFiles.map(async (file) => {
        const objectUrl = URL.createObjectURL(file)
        const thumbnail = await makeThumbnail(file, 300)
        return { file, objectUrl, thumbnail, taggedChildIds: [], hasNGChild: false }
      })
    )
    setPreviews((prev) => [...prev, ...items])
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  const handleTagChildren = (index: number, ids: string[]) => {
    const hasNG = children.some((c) => c.isPhotoNG && ids.includes(c.id))
    setPreviews((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, taggedChildIds: ids, hasNGChild: hasNG } : item
      )
    )
  }

  const handleRemove = (index: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (previews.length === 0) { toast.error('写真を選択してください'); return }

    let eventId = selectedEventId
    if (!useExistingEvent || !eventId) {
      if (!newEventName.trim()) { toast.error('イベント名を入力してください'); return }
      eventId = addEvent({
        name: newEventName.trim(),
        date: newEventDate,
        className: newEventClass,
        notes: newEventNotes.trim(),
      })
    }

    setUploading(true)
    let succeeded = 0

    for (const item of previews) {
      try {
        // store に先に登録して ID を確定させてから IndexedDB に保存
        const photoId = addPhoto({
          eventId,
          filename: item.file.name,
          takenAt: newEventDate || format(new Date(), 'yyyy-MM-dd'),
          taggedChildIds: item.taggedChildIds,
          hasNGChild: item.hasNGChild,
          status: 'pending',
          rejectedReason: null,
          thumbnailDataUrl: item.thumbnail,
        })
        await savePhoto(photoId, item.file)
        succeeded++
      } catch {
        toast.error(`${item.file.name} のアップロードに失敗しました`)
      }
    }

    setUploading(false)
    if (succeeded > 0) {
      previews.forEach((p) => URL.revokeObjectURL(p.objectUrl))
      toast.success(`${succeeded}枚をアップロードしました`)
      navigate('/photos/gallery')
    }
  }

  const ngCount = previews.filter((p) => p.hasNGChild).length

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="写真をアップロード"
        subtitle="イベント・クラスを選択してから写真を追加してください"
      />

      {/* イベント設定 */}
      <Card className="p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">① イベント・撮影情報</p>

        {events.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setUseExistingEvent(true)}
              className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${useExistingEvent ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              既存イベントに追加
            </button>
            <button
              onClick={() => setUseExistingEvent(false)}
              className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${!useExistingEvent ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              新しいイベントを作成
            </button>
          </div>
        )}

        {useExistingEvent && events.length > 0 ? (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}（{ev.date}）
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            <input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="イベント名（例：運動会、春の遠足）"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">撮影日</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">クラス（任意）</label>
                <select
                  value={newEventClass}
                  onChange={(e) => setNewEventClass(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">全クラス</option>
                  {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <input
              value={newEventNotes}
              onChange={(e) => setNewEventNotes(e.target.value)}
              placeholder="メモ（任意）"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}
      </Card>

      {/* ドラッグ&ドロップ */}
      <div>
        <p className="text-sm font-bold text-gray-800 mb-2">② 写真を選択</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-colors
            ${dragging ? 'border-blue-500 bg-blue-50' : 'border-blue-300 hover:bg-blue-50'}`}
        >
          <Upload size={32} className="text-blue-400" />
          <p className="text-sm font-medium text-blue-600">タップまたはドラッグ＆ドロップで写真を追加</p>
          <p className="text-xs text-gray-400">JPG・PNG対応 · 複数選択可</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* NG警告 */}
      {ngCount > 0 && (
        <Card className="p-4 border-red-300 bg-red-50">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">⚠️ 写真NG園児が含まれています</p>
              <p className="text-xs text-red-700 mt-0.5">
                {ngCount}枚の写真に写真NG設定の園児が含まれています。<br />
                アップロード後、承認画面で必ず確認してください。
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* プレビュー */}
      {previews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-800">③ 確認（{previews.length}枚）</p>
            <button
              onClick={() => { previews.forEach((p) => URL.revokeObjectURL(p.objectUrl)); setPreviews([]) }}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              全て削除
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((item, i) => (
              <PhotoPreviewCard
                key={`${item.file.name}-${i}`}
                item={item}
                index={i}
                childList={children}
                onTagChildren={(ids) => handleTagChildren(i, ids)}
                onRemove={() => handleRemove(i)}
              />
            ))}
            {/* 追加ボタン */}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            >
              <Plus size={20} />
              <span className="text-xs">追加</span>
            </button>
          </div>
        </div>
      )}

      {/* アップロードボタン */}
      {previews.length > 0 && (
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleUpload}
          loading={uploading}
          disabled={uploading}
        >
          <Upload size={18} />
          {previews.length}枚をアップロードする
        </Button>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-800 leading-relaxed">
          📌 アップロード後は「写真ギャラリー」で確認・承認してください。<br />
          承認されていない写真は保護者に共有されません。
        </p>
      </div>

      <div className="h-4" />
    </div>
  )
}

export default PhotoUpload
