import React, { useState } from 'react'
import {
  Plus, ChevronRight, AlertCircle, ArrowRight, CheckCircle2, Trash2,
} from 'lucide-react'
import { Card, Button, SectionHeader, Modal } from '@/components/ui'
import { useNearMissStore } from '@/stores/appStore'
import { useFacilityStore } from '@/stores/facilityStore'
import type { NearMiss as NearMissRecord, NearMissStep, NearMissScene } from '@/types'
import { NEAR_MISS_SCENE_LABELS, NEAR_MISS_STEP_CONFIG } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

const STEP_FLOW: NearMissStep[] = ['occurred', 'cause', 'action', 'shared', 'recheck']

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

// 詳細・編集モーダル
const NearMissDetail: React.FC<{ nm: NearMissRecord; onClose: () => void }> = ({ nm, onClose }) => {
  const { updateNearMiss, advanceStep, deleteNearMiss } = useNearMissStore()
  const stepCfg = NEAR_MISS_STEP_CONFIG[nm.step]
  const nextStep = STEP_FLOW[STEP_FLOW.indexOf(nm.step) + 1]

  const [editing, setEditing] = useState(false)
  const [why, setWhy] = useState(nm.why_it_happened ?? '')
  const [what, setWhat] = useState(nm.what_to_change ?? '')
  const [shared, setShared] = useState(nm.shared_with ?? '')
  const [recheck, setRecheck] = useState(nm.recheck_date ?? '')

  // 別デバイスからの同期でnmが更新されたとき、フォームをリセット
  React.useEffect(() => {
    setWhy(nm.why_it_happened ?? '')
    setWhat(nm.what_to_change ?? '')
    setShared(nm.shared_with ?? '')
    setRecheck(nm.recheck_date ?? '')
    setEditing(false)
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
    // stale な nm prop を使わず、ストアの最新データでバリデーション
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

  const handleDelete = () => {
    if (window.confirm('この記録を削除しますか？')) {
      deleteNearMiss(nm.id)
      toast.success('削除しました')
      onClose()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stepCfg.color}`}>{stepCfg.label}</span>
        <span className="text-xs text-gray-500">{format(new Date(nm.occurred_at), 'yyyy年M月d日', { locale: ja })} 発生</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{NEAR_MISS_SCENE_LABELS[nm.scene]}</span>
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
              <Button variant="primary" fullWidth onClick={handleSave}>保存する</Button>
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

// 新規フォーム
const SCENES = Object.entries(NEAR_MISS_SCENE_LABELS) as [NearMissScene, string][]

const NewNearMissForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addNearMiss } = useNearMissStore()
  const { facility } = useFacilityStore()
  const [scene, setScene] = useState<NearMissScene>('outdoor')
  const [what, setWhat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    if (!what.trim()) {
      toast.error('「何が起きかけたか」を入力してください')
      return
    }
    setSaving(true)
    setTimeout(() => {
      addNearMiss({
        scene,
        what_happened: what.trim(),
        created_by: facility?.director_name ?? '担当者',
      })
      toast.success('ヒヤリハットを記録しました')
      setSaving(false)
      onClose()
    }, 400)
  }

  return (
    <div className="space-y-4">
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

// メインページ
export const NearMiss: React.FC = () => {
  const { nearMisses } = useNearMissStore()
  const [selected, setSelected] = useState<NearMissRecord | null>(null)
  const [showNew, setShowNew] = useState(false)

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
              return (
                <Card key={nm.id} className="p-4" onClick={() => setSelected(nm)}>
                  <div className="flex items-start gap-2 justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 flex-1 break-anywhere line-clamp-2">{nm.what_happened}</p>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${stepCfg.color}`}>{stepCfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-400">{format(new Date(nm.occurred_at), 'M月d日', { locale: ja })}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{NEAR_MISS_SCENE_LABELS[nm.scene]}</span>
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
              <Card key={nm.id} className="p-4 opacity-70" onClick={() => setSelected(nm)}>
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
        <div className="text-center py-16">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">まだ記録がありません</p>
          <p className="text-xs text-gray-400 mt-1 mb-6">気になることを小さくても記録しておきましょう</p>
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={16} />最初の記録をする
          </Button>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="ヒヤリハット詳細">
        {selected && <NearMissDetail nm={selected} onClose={() => setSelected(null)} />}
      </Modal>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="ヒヤリハットを記録する">
        <NewNearMissForm onClose={() => setShowNew(false)} />
      </Modal>

      <div className="h-4" />
    </div>
  )
}

export default NearMiss
