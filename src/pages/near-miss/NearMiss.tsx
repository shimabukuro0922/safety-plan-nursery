import React, { useState } from 'react'
import {
  Plus, ChevronRight, AlertCircle, ArrowRight, CheckCircle2, Trash2,
  List, Map,
} from 'lucide-react'
import { Card, Button, SectionHeader, Modal } from '@/components/ui'
import { useNearMissStore, useNearMissZoneStore } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import type { NearMiss as NearMissRecord, NearMissStep, NearMissScene } from '@/types'
import { NEAR_MISS_SCENE_LABELS, NEAR_MISS_STEP_CONFIG } from '@/types'
import { useAllZones, findZone } from '@/lib/nearMissZones'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

const STEP_FLOW: NearMissStep[] = ['occurred', 'cause', 'action', 'shared', 'recheck']

// ==============================
// ステップフロー表示
// ==============================
const StepFlow: React.FC<{ current: NearMissStep }> = ({ current }) => {
  const currentIdx = STEP_FLOW.indexOf(current)
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {STEP_FLOW.map((step, i) => {
        const cfg = NEAR_MISS_STEP_CONFIG[step]
        const done = i <= currentIdx
        return (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${
              i === currentIdx ? cfg.color : done ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {done && i < currentIdx && <CheckCircle2 size={12} />}
              {cfg.label}
            </div>
            {i < STEP_FLOW.length - 1 && (
              <ArrowRight size={12} className={`shrink-0 ${i < currentIdx ? 'text-green-400' : 'text-gray-300'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ==============================
// ゾーンのヒート色
// ==============================
function getZoneHeat(count: number): { bg: string; border: string; text: string; badge: string } {
  if (count === 0) return {
    bg: 'bg-gray-50', border: 'border-gray-200',
    text: 'text-gray-400', badge: '',
  }
  if (count <= 2) return {
    bg: 'bg-yellow-50', border: 'border-yellow-300',
    text: 'text-yellow-800', badge: 'bg-yellow-400 text-white',
  }
  if (count <= 5) return {
    bg: 'bg-orange-50', border: 'border-orange-400',
    text: 'text-orange-800', badge: 'bg-orange-500 text-white',
  }
  return {
    bg: 'bg-red-100', border: 'border-red-500',
    text: 'text-red-800', badge: 'bg-red-600 text-white',
  }
}

// ==============================
// マップビュー
// ==============================
const NearMissMapView: React.FC<{
  nearMisses: NearMissRecord[]
  onSelectZone: (loc: string) => void
}> = ({ nearMisses, onSelectZone }) => {
  const zones = useAllZones()

  const countByLoc = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const nm of nearMisses) {
      if (nm.location) map[nm.location] = (map[nm.location] ?? 0) + 1
    }
    return map
  }, [nearMisses])

  const noLocationCount = nearMisses.filter((nm) => !nm.location).length
  const totalCount = nearMisses.length
  const maxCount = Math.max(...Object.values(countByLoc), 0)

  const hotZone = maxCount > 0
    ? zones.find((z) => (countByLoc[z.key] ?? 0) === maxCount)
    : null

  return (
    <div className="space-y-4">
      {/* 凡例 */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
        <span className="font-medium">危険度：</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />1〜2件</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />3〜5件</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />6件以上</span>
      </div>

      {/* ゾーングリッド（3列） */}
      <div className="grid grid-cols-3 gap-2">
        {zones.map((zone) => {
          const count = countByLoc[zone.key] ?? 0
          const heat = getZoneHeat(count)
          const isHotspot = count > 0
          return (
            <button
              key={zone.key}
              onClick={() => isHotspot && onSelectZone(zone.key)}
              disabled={!isHotspot}
              className={`
                relative flex flex-col items-center justify-center gap-1
                p-3 rounded-xl border-2 transition-all
                ${heat.bg} ${heat.border}
                ${isHotspot ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default opacity-60'}
              `}
            >
              {count > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${heat.badge}`}>
                  {count}
                </span>
              )}
              <span className="text-xl leading-none">{zone.emoji}</span>
              <span className={`text-[11px] font-medium text-center leading-tight ${heat.text}`}>
                {zone.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* サマリー */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>記録総件数</span>
          <span className="font-bold text-gray-800">{totalCount}件</span>
        </div>
        {hotZone && (
          <div className="flex justify-between">
            <span>最多ゾーン</span>
            <span className="font-bold text-orange-700">
              {hotZone.emoji} {hotZone.label}（{maxCount}件）
            </span>
          </div>
        )}
        {noLocationCount > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>場所未設定</span>
            <span>{noLocationCount}件</span>
          </div>
        )}
      </div>

      {totalCount === 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          記録がまだありません。<br />
          「記録する」から最初のヒヤリハットを入力してください。
        </div>
      )}
    </div>
  )
}

// ==============================
// ゾーン別一覧モーダル
// ==============================
const ZoneDetailModal: React.FC<{
  location: string | null
  nearMisses: NearMissRecord[]
  onClose: () => void
  onSelectNm: (id: string) => void
}> = ({ location, nearMisses, onClose, onSelectNm }) => {
  const { customZones } = useNearMissZoneStore()
  if (!location) return null
  const zone = findZone(location, customZones)
  const filtered = nearMisses.filter((nm) => nm.location === location)
  return (
    <Modal
      open={!!location}
      onClose={onClose}
      title={`${zone?.emoji ?? ''} ${zone?.label ?? ''} のヒヤリハット`}
    >
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">この場所の記録はありません</p>
        ) : (
          filtered.map((nm) => {
            const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step]
            return (
              <button
                key={nm.id}
                onClick={() => { onSelectNm(nm.id); onClose() }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors space-y-1"
              >
                <div className="flex items-start gap-2 justify-between">
                  <p className="text-sm text-gray-900 flex-1 break-anywhere line-clamp-2">{nm.what_happened}</p>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${stepCfg.color}`}>{stepCfg.label}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {format(new Date(nm.occurred_at), 'M月d日', { locale: ja })} ・ {NEAR_MISS_SCENE_LABELS[nm.scene]}
                </p>
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}

// ==============================
// 詳細・編集モーダル
// ==============================
const NearMissDetail: React.FC<{ nm: NearMissRecord; onClose: () => void }> = ({ nm, onClose }) => {
  const { updateNearMiss, advanceStep, deleteNearMiss } = useNearMissStore()
  const { customZones } = useNearMissZoneStore()
  const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step] ?? NEAR_MISS_STEP_CONFIG['occurred']
  const nextStep = STEP_FLOW[STEP_FLOW.indexOf(nm.step) + 1]

  const [editing, setEditing] = useState(false)
  const [why, setWhy] = useState(nm.why_it_happened ?? '')
  const [what, setWhat] = useState(nm.what_to_change ?? '')
  const [shared, setShared] = useState(nm.shared_with ?? '')
  const [recheck, setRecheck] = useState(nm.recheck_date ?? '')

  React.useEffect(() => {
    // nm.id が変わったとき（別のヒヤリハット選択時）にフォームをリセット
    /* eslint-disable react-hooks/set-state-in-effect */
    setWhy(nm.why_it_happened ?? '')
    setWhat(nm.what_to_change ?? '')
    setShared(nm.shared_with ?? '')
    setRecheck(nm.recheck_date ?? '')
    setEditing(false)
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nm.id])

  const handleSave = () => {
    updateNearMiss(nm.id, {
      why_it_happened: why.trim() || null,
      what_to_change: what.trim() || null,
      shared_with: shared.trim() || null,
      recheck_date: recheck || null,
    })
    toast.success('保存しました')
    setEditing(false)
  }

  const handleAdvance = () => {
    const current = useNearMissStore.getState().nearMisses.find((n) => n.id === nm.id) ?? nm
    if (current.step === 'cause' && !current.why_it_happened && !why.trim()) {
      toast.error('「なぜ起きたか」を入力してから進めてください')
      setEditing(true)
      return
    }
    if (current.step === 'action' && !current.what_to_change && !what.trim()) {
      toast.error('「明日から何を変えるか」を入力してから進めてください')
      setEditing(true)
      return
    }
    advanceStep(nm.id)
    if (nextStep) toast.success(`「${NEAR_MISS_STEP_CONFIG[nextStep].label}」に進みました`)
    onClose()
  }

  const handleSaveAndAdvance = () => {
    if (nm.step === 'cause' && !why.trim()) {
      toast.error('「なぜ起きたか」を入力してから進めてください')
      return
    }
    if (nm.step === 'action' && !what.trim()) {
      toast.error('「明日から何を変えるか」を入力してから進めてください')
      return
    }
    updateNearMiss(nm.id, {
      why_it_happened: why.trim() || null,
      what_to_change: what.trim() || null,
      shared_with: shared.trim() || null,
      recheck_date: recheck || null,
    })
    advanceStep(nm.id)
    if (nextStep) toast.success(`「${NEAR_MISS_STEP_CONFIG[nextStep].label}」に進みました`)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm('この記録を削除しますか？')) {
      deleteNearMiss(nm.id)
      toast.success('削除しました')
      onClose()
    }
  }

  const locationZone = findZone(nm.location, customZones)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stepCfg.color}`}>{stepCfg.label}</span>
        <span className="text-xs text-gray-500">{format(new Date(nm.occurred_at), 'yyyy年M月d日', { locale: ja })} 発生</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{NEAR_MISS_SCENE_LABELS[nm.scene]}</span>
        {locationZone && (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            {locationZone.emoji} {locationZone.label}
          </span>
        )}
      </div>

      <StepFlow current={nm.step} />

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">何が起きかけたか</p>
          <p className="text-sm text-gray-800 break-anywhere">{nm.what_happened}</p>
        </div>

        {editing ? (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">なぜ起きたか</label>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3} placeholder="原因を記入してください" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">明日から何を変えるか</label>
              <textarea value={what} onChange={(e) => setWhat(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={3} placeholder="具体的な対策を記入してください" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">誰に共有したか</label>
              <input type="text" value={shared} onChange={(e) => setShared(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="例：全職員（朝礼にて）" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">再確認日</label>
              <input type="date" value={recheck} onChange={(e) => setRecheck(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="flex gap-2">
              {nextStep ? (
                <Button variant="primary" fullWidth onClick={handleSaveAndAdvance}>
                  <ChevronRight size={16} />
                  保存して次のステップへ
                </Button>
              ) : (
                <Button variant="primary" fullWidth onClick={handleSave}>保存する</Button>
              )}
              <Button variant="secondary" onClick={() => setEditing(false)}>キャンセル</Button>
            </div>
          </>
        ) : (
          <>
            {nm.why_it_happened && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">なぜ起きたか</p>
                <p className="text-sm text-gray-800 break-anywhere">{nm.why_it_happened}</p>
              </div>
            )}
            {nm.what_to_change && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">明日から何を変えるか</p>
                <p className="text-sm text-gray-800 break-anywhere">{nm.what_to_change}</p>
              </div>
            )}
            {nm.shared_with && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">誰に共有したか</p>
                <p className="text-sm text-gray-800 break-anywhere">{nm.shared_with}</p>
              </div>
            )}
            {nm.recheck_date && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">再確認日</p>
                <p className="text-sm text-gray-800">{format(new Date(nm.recheck_date), 'yyyy年M月d日', { locale: ja })}</p>
              </div>
            )}
            <Button variant="secondary" fullWidth onClick={() => setEditing(true)}>
              内容を追記・編集する
            </Button>
          </>
        )}
      </div>

      {nextStep && !editing && (
        <Button variant="primary" fullWidth onClick={handleAdvance}>
          <ChevronRight size={16} />
          次のステップへ：{NEAR_MISS_STEP_CONFIG[nextStep].label}
        </Button>
      )}
      {!nextStep && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
          <CheckCircle2 size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-sm text-green-700 font-medium">改善サイクル完了</p>
        </div>
      )}

      <button
        onClick={handleDelete}
        className="w-full flex items-center justify-center gap-2 text-xs text-red-400 py-2 hover:text-red-600"
      >
        <Trash2 size={14} /> この記録を削除する
      </button>
    </div>
  )
}

// ==============================
// 新規フォーム
// ==============================
const SCENES = Object.entries(NEAR_MISS_SCENE_LABELS) as [NearMissScene, string][]

const NewNearMissForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addNearMiss } = useNearMissStore()
  const { facility } = useFacilityStore()
  const zones = useAllZones()
  const [scene, setScene] = useState<NearMissScene>('outdoor')
  const [location, setLocation] = useState<string | null>(null)
  const [what, setWhat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    if (!what.trim()) {
      toast.error('「何が起きかけたか」を入力してください')
      return
    }
    setSaving(true)
    addNearMiss({
      scene,
      location,
      what_happened: what.trim(),
      created_by: facility?.director_name ?? '担当者',
    })
    toast.success('ヒヤリハットを記録しました')
    setSaving(false)
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* 場面 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">どの場面で起きかけましたか？</label>
        <div className="flex flex-wrap gap-1.5">
          {SCENES.map(([key, label]) => (
            <button key={key} onClick={() => setScene(key)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                scene === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 場所（マップ用） */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
          どこで起きかけましたか？
          <span className="text-gray-400 font-normal ml-1">（任意・マップに表示されます）</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {zones.map((zone) => (
            <button
              key={zone.key}
              onClick={() => setLocation(location === zone.key ? null : zone.key)}
              className={`flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium border transition-colors text-left ${
                location === zone.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <span className="text-base leading-none shrink-0">{zone.emoji}</span>
              <span className="break-anywhere leading-tight">{zone.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容 */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
          何が起きかけましたか？<span className="text-red-500 ml-1">必須</span>
        </label>
        <textarea value={what} onChange={(e) => setWhat(e.target.value)}
          placeholder="例：3歳児が砂場の縁につまずき、転倒しそうになった。近くの保育士がすぐ支えたため怪我はなかった。"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={4} />
      </div>

      <div className="bg-blue-50 rounded-xl p-3">
        <p className="text-xs text-blue-700 break-anywhere">
          まず「何が起きかけたか」だけ記録すれば大丈夫です。
          「なぜ起きたか」「対策」は後から追記できます。
        </p>
      </div>

      <Button variant="primary" fullWidth loading={saving} onClick={handleSave}>記録する</Button>
    </div>
  )
}

// ==============================
// メインページ
// ==============================
type ViewMode = 'list' | 'map'

export const NearMiss: React.FC = () => {
  const { nearMisses } = useNearMissStore()
  const { customZones } = useNearMissZoneStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? (nearMisses.find((nm) => nm.id === selectedId) ?? null) : null
  const [showNew, setShowNew] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [zoneFilter, setZoneFilter] = useState<string | null>(null)

  const stepOrder: Record<NearMissStep, number> = {
    occurred: 0, cause: 1, action: 2, shared: 3, recheck: 4,
  }
  const sorted = [...nearMisses].sort((a, b) => stepOrder[a.step] - stepOrder[b.step])
  const inProgress = sorted.filter((nm) => nm.step !== 'recheck')
  const completed = sorted.filter((nm) => nm.step === 'recheck')

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="ヒヤリハット改善ノート"
        subtitle="記録して終わりにしない。改善まで回す。"
        action={
          <Button size="sm" variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={14} /> 記録する
          </Button>
        }
      />

      {/* タブ */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={15} />
          一覧
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Map size={15} />
          ヒヤリハットマップ
          {nearMisses.filter((nm) => nm.location).length > 0 && (
            <span className="w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {nearMisses.filter((nm) => nm.location).length}
            </span>
          )}
        </button>
      </div>

      {/* マップビュー */}
      {viewMode === 'map' && (
        <NearMissMapView
          nearMisses={nearMisses}
          onSelectZone={(loc) => setZoneFilter(loc)}
        />
      )}

      {/* 一覧ビュー */}
      {viewMode === 'list' && (
        <>
          <Card className="p-3 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2 font-medium">改善の5ステップ</p>
            <div className="flex items-center gap-1 flex-wrap">
              {STEP_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                  <span className={`text-xs px-2 py-0.5 rounded ${NEAR_MISS_STEP_CONFIG[step].color}`}>
                    {NEAR_MISS_STEP_CONFIG[step].label}
                  </span>
                  {i < STEP_FLOW.length - 1 && <ArrowRight size={12} className="text-gray-300 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </Card>

          {inProgress.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                改善進行中 <span className="text-orange-500 font-bold">{inProgress.length}件</span>
              </p>
              <div className="space-y-2">
                {inProgress.map((nm) => {
                  const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step]
                  const locationZone = findZone(nm.location, customZones)
                  return (
                    <Card key={nm.id} className="p-4" onClick={() => setSelectedId(nm.id)}>
                      <div className="flex items-start gap-2 justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 flex-1 break-anywhere line-clamp-2">{nm.what_happened}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${stepCfg.color}`}>{stepCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-gray-400">{format(new Date(nm.occurred_at), 'M月d日', { locale: ja })}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{NEAR_MISS_SCENE_LABELS[nm.scene]}</span>
                        {locationZone && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {locationZone.emoji} {locationZone.label}
                          </span>
                        )}
                      </div>
                      <StepFlow current={nm.step} />
                      <div className="flex items-center gap-1 mt-2 text-blue-600">
                        <span className="text-xs">タップして改善を進める</span>
                        <ChevronRight size={12} />
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">改善完了 {completed.length}件</p>
              <div className="space-y-2">
                {completed.map((nm) => (
                  <Card key={nm.id} className="p-4 opacity-70" onClick={() => setSelectedId(nm.id)}>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700 flex-1 break-anywhere line-clamp-2">{nm.what_happened}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      {format(new Date(nm.occurred_at), 'M月d日', { locale: ja })} ・ {NEAR_MISS_SCENE_LABELS[nm.scene]}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {nearMisses.length === 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 px-5 py-8 text-center">
              <AlertCircle size={40} className="text-orange-300 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-800">ヒヤリハットはまだありません</p>
              <p className="text-xs text-gray-500 mt-2 mb-5 leading-relaxed break-anywhere">
                事故が起きてから記録するより、<br />
                「ヒヤッとした」段階で記録することが大切です。<br />
                まず1件、試しに記録してみましょう。
              </p>
              <Button variant="primary" onClick={() => setShowNew(true)}>
                <Plus size={16} />最初のヒヤリハットを記録する
              </Button>
              <p className="text-xs text-gray-400 mt-3">記録するのは「何が起きかけたか」だけでOKです</p>
            </div>
          )}
        </>
      )}

      {/* 詳細モーダル */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="ヒヤリハット詳細">
        {selected && <NearMissDetail nm={selected} onClose={() => setSelectedId(null)} />}
      </Modal>

      {/* 新規記録モーダル */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="ヒヤリハットを記録する">
        <NewNearMissForm onClose={() => setShowNew(false)} />
      </Modal>

      {/* ゾーン別詳細モーダル */}
      <ZoneDetailModal
        location={zoneFilter}
        nearMisses={nearMisses}
        onClose={() => setZoneFilter(null)}
        onSelectNm={(id) => { setSelectedId(id); setZoneFilter(null) }}
      />

      <div className="h-4" />
    </div>
  )
}

export default NearMiss
