import React, { useState } from 'react'
import { Modal } from '@/components/ui'
import {
  LayoutDashboard, ClipboardCheck, AlertCircle, History,
  FileText, CalendarDays, Users, Bell, ChevronRight,
} from 'lucide-react'

interface GuideSection {
  key: string
  icon: React.ReactNode
  title: string
  steps: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    key: 'start',
    icon: <LayoutDashboard size={18} className="text-emerald-600" />,
    title: 'はじめに（最初の流れ）',
    steps: [
      '「設定」で園名・園長名を入力してください（最初の1回だけ）',
      'ホームに「今月やること」が5つ表示されます',
      '上から順に取り組むと、月次の安全管理が回ります',
    ],
  },
  {
    key: 'monthly',
    icon: <ClipboardCheck size={18} className="text-green-600" />,
    title: '月次チェック表',
    steps: [
      '「チェック」タブを開くと、今月の安全確認10項目が並びます',
      '実施したら項目をタップして、実施者名を入力して「完了」にします',
      '完了した記録は「記録」ページに自動で残ります',
      '月が変わっても記録は累積されます',
    ],
  },
  {
    key: 'nearmiss',
    icon: <AlertCircle size={18} className="text-orange-600" />,
    title: 'ヒヤリハット改善ノート',
    steps: [
      '「ヒヤリ」タブで「＋ 新しいヒヤリハットを記録」をタップします',
      '場面・内容・記入者を入力して保存します（ステップ1「発生記録」）',
      '次に原因分析→対策決定→職員共有→再確認と、5ステップで進めます',
      '各ステップはカードの「次のステップへ」ボタンで進めます',
      '記録は削除するまで残り続けます',
    ],
  },
  {
    key: 'seasonal',
    icon: <CalendarDays size={18} className="text-purple-600" />,
    title: '季節前チェック表',
    steps: [
      '「季節前チェック」は春・夏・秋・冬の4シーズンあります',
      '実施者名を入力してから、各項目をタップして完了マークをつけます',
      '完了日と実施者名が記録されます',
      'もう一度タップすると未実施に戻せます',
    ],
  },
  {
    key: 'staff',
    icon: <Users size={18} className="text-indigo-600" />,
    title: '職員共有シート',
    steps: [
      '「朝礼用1枚資料」「園内研修用資料」「新人向けガイド」の3種類を作れます',
      '種類を選んでテーマを入力し、「たたき台を作る」をタップします',
      'できた文章は自由に編集できます',
      'ブラウザの印刷機能（Ctrl+P）でPDF保存できます',
    ],
  },
  {
    key: 'guardian',
    icon: <Bell size={18} className="text-yellow-600" />,
    title: '保護者周知文',
    steps: [
      '周知したい安全カテゴリを1つ以上選びます',
      '文体を選んで「文章を自動で作る」をタップします',
      '生成された文章は上の入力欄で自由に編集できます',
      '配布前に必ず内容を確認してください',
    ],
  },
  {
    key: 'reports',
    icon: <FileText size={18} className="text-emerald-600" />,
    title: '報告書',
    steps: [
      '「新規作成」から報告書の種類と文体を選びます',
      '空白の報告書が作られるので、各セクションに内容を入力します',
      '「保存する」ボタンで内容を保存してください',
      'ステータスを「レビュー中」→「承認済み」と進めることができます',
    ],
  },
  {
    key: 'records',
    icon: <History size={18} className="text-gray-600" />,
    title: '実施記録・証跡',
    steps: [
      'チェック表を完了すると自動でここに記録されます',
      'ヒヤリハットの記録もここに一覧表示されます',
      '監査や報告書作成のときにここを確認してください',
    ],
  },
]

interface GuideModalProps {
  open: boolean
  onClose: () => void
}

export const GuideModal: React.FC<GuideModalProps> = ({ open, onClose }) => {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedSection = GUIDE_SECTIONS.find((s) => s.key === selected)

  return (
    <Modal open={open} onClose={() => { setSelected(null); onClose() }} title="操作ガイド">
      {selected === null ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            各機能の使い方を確認できます。気になる項目をタップしてください。
          </p>
          {GUIDE_SECTIONS.map((section) => (
            <button
              key={section.key}
              onClick={() => setSelected(section.key)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl transition-colors text-left min-h-[52px]"
            >
              <div className="shrink-0">{section.icon}</div>
              <span className="flex-1 text-sm font-medium text-gray-800 break-anywhere">{section.title}</span>
              <ChevronRight size={16} className="text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 mb-2"
          >
            ← 一覧に戻る
          </button>
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            {selectedSection?.icon}
            <h3 className="text-sm font-bold text-gray-900">{selectedSection?.title}</h3>
          </div>
          <ol className="space-y-3">
            {selectedSection?.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed break-anywhere flex-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  )
}

export default GuideModal
