import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, Images, Users, CheckCircle2, Clock, ShieldAlert, ChevronRight } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui'
import { usePhotoStore } from '@/stores/photoStore'
import { useChildrenStore } from '@/stores/childrenStore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export const PhotoHub: React.FC = () => {
  const navigate = useNavigate()
  const { photos, events } = usePhotoStore()
  const { children } = useChildrenStore()

  const total = photos.length
  const pending = photos.filter((p) => p.status === 'pending').length
  const approved = photos.filter((p) => p.status === 'approved').length
  const ngDetected = photos.filter((p) => p.hasNGChild && p.status !== 'rejected').length
  const ngChildCount = children.filter((c) => c.isPhotoNG).length

  const recentPending = photos
    .filter((p) => p.status === 'pending')
    .slice(0, 6)

  const QUICK_ACTIONS = [
    {
      label: '写真をアップロード',
      sub: 'イベント・クラスごとに整理',
      icon: <Upload size={24} className="text-blue-500" />,
      color: 'border-blue-200 bg-blue-50',
      path: '/photos/upload',
    },
    {
      label: '写真ギャラリー',
      sub: '確認・承認・タグ付け',
      icon: <Images size={24} className="text-green-500" />,
      color: 'border-green-200 bg-green-50',
      path: '/photos/gallery',
    },
    {
      label: '園児管理',
      sub: '写真NGの登録・確認',
      icon: <Users size={24} className="text-purple-500" />,
      color: 'border-purple-200 bg-purple-50',
      path: '/children',
    },
  ]

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="写真管理"
        subtitle="アップロード・確認・承認を一元管理"
      />

      {/* NGアラート */}
      {ngDetected > 0 && (
        <Card className="p-4 border-red-300 bg-red-50">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">⚠️ 写真NG園児が検出されています</p>
              <p className="text-xs text-red-700 mt-0.5">
                {ngDetected}枚の写真に写真NG設定の園児が写っている可能性があります。<br />
                承認前に必ず確認してください。
              </p>
              <button
                onClick={() => navigate('/photos/gallery?filter=ng')}
                className="mt-2 text-xs font-semibold text-red-700 underline"
              >
                該当写真を確認する →
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <Camera size={20} className="text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">総写真数</p>
        </Card>
        <Card className={`p-4 text-center ${pending > 0 ? 'border-orange-200 bg-orange-50' : ''}`}>
          <Clock size={20} className={`mx-auto mb-1 ${pending > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
          <p className={`text-2xl font-bold ${pending > 0 ? 'text-orange-700' : 'text-gray-300'}`}>{pending}</p>
          <p className="text-xs text-gray-500">確認待ち</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 size={20} className={`mx-auto mb-1 ${approved > 0 ? 'text-green-500' : 'text-gray-300'}`} />
          <p className={`text-2xl font-bold ${approved > 0 ? 'text-green-700' : 'text-gray-300'}`}>{approved}</p>
          <p className="text-xs text-gray-500">承認済み</p>
        </Card>
        <Card className={`p-4 text-center ${ngChildCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <ShieldAlert size={20} className={`mx-auto mb-1 ${ngChildCount > 0 ? 'text-red-500' : 'text-gray-300'}`} />
          <p className={`text-2xl font-bold ${ngChildCount > 0 ? 'text-red-700' : 'text-gray-300'}`}>{ngChildCount}</p>
          <p className="text-xs text-gray-500">写真NG登録</p>
        </Card>
      </div>

      {/* クイックアクション */}
      <div className="space-y-2">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.path}
            onClick={() => navigate(a.path)}
            className={`w-full flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-colors hover:opacity-80 ${a.color}`}
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.sub}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 shrink-0" />
          </button>
        ))}
      </div>

      {/* 確認待ち写真プレビュー */}
      {recentPending.length > 0 && (
        <div>
          <SectionHeader
            title={`確認待ち (${pending}枚)`}
            action={
              <button onClick={() => navigate('/photos/gallery?filter=pending')} className="text-xs text-blue-600 flex items-center gap-1">
                すべて見る <ChevronRight size={14} />
              </button>
            }
          />
          <div className="grid grid-cols-3 gap-1.5">
            {recentPending.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate('/photos/gallery?filter=pending')}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-300"
              >
                {p.thumbnailDataUrl ? (
                  <img src={p.thumbnailDataUrl} alt={p.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Camera size={20} className="text-gray-300" />
                  </div>
                )}
                {p.hasNGChild && (
                  <div className="absolute inset-0 border-4 border-red-500 rounded-xl pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* イベント一覧 */}
      {events.length > 0 && (
        <div>
          <SectionHeader title="最近のイベント" />
          <div className="space-y-2">
            {events.slice(0, 3).map((ev) => {
              const evPhotos = photos.filter((p) => p.eventId === ev.id)
              const evPending = evPhotos.filter((p) => p.status === 'pending').length
              return (
                <Card key={ev.id} className="p-4" onClick={() => navigate(`/photos/gallery?eventId=${ev.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Images size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 break-anywhere">{ev.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(ev.date), 'M月d日', { locale: ja })}
                        {ev.className && ` ・ ${ev.className}`}
                        ・ {evPhotos.length}枚
                      </p>
                    </div>
                    {evPending > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                        {evPending}件未確認
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {total === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Camera size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">写真がまだありません</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">「写真をアップロード」から始めましょう</p>
          <button
            onClick={() => navigate('/photos/upload')}
            className="text-sm text-blue-600 font-medium underline"
          >
            写真をアップロードする →
          </button>
        </Card>
      )}

      <div className="h-4" />
    </div>
  )
}

export default PhotoHub
