import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  Lightbulb, CheckCircle, RotateCcw, FileDown,
} from 'lucide-react'
import { Card, Button, StatusBadge, Modal, SectionHeader } from '@/components/ui'
import { DEMO_REPORTS, DEMO_REPORT_CONTENT } from '@/lib/demoData'
import type { ReportStatus, ReportSection } from '@/types'
import { STATUS_CONFIG } from '@/types'
import toast from 'react-hot-toast'

// ==============================
// セクションエディタ
// ==============================
const SectionEditor: React.FC<{
  section: ReportSection
  onChange: (id: string, body: string) => void
  onRegenerate: (id: string, instruction: string) => Promise<void>
}> = ({ section, onChange, onRegenerate }) => {
  const [showAI, setShowAI] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [isRegen, setIsRegen] = useState(false)

  const handleRegen = async () => {
    setIsRegen(true)
    await onRegenerate(section.id, instruction)
    setIsRegen(false)
    setShowAI(false)
    setInstruction('')
  }

  return (
    <Card className="p-4 mb-3">
      {/* セクションヘッダ */}
      <div className="flex items-start gap-2 mb-2">
        <h3 className="text-sm font-bold text-gray-900 flex-1 break-anywhere">{section.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          section.ai_generated
            ? 'bg-violet-100 text-violet-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {section.last_edited_by === 'ai' ? '✨ AI生成' : '✏️ 手動編集'}
        </span>
      </div>

      {/* 本文テキストエリア */}
      <textarea
        defaultValue={section.body}
        onChange={(e) => onChange(section.id, e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                   resize-none min-h-[120px] leading-relaxed break-anywhere
                   focus:ring-2 focus:ring-blue-500 focus:outline-none
                   text-gray-800"
      />

      {/* AI再編集パネル */}
      {showAI ? (
        <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-violet-700 mb-2">
            AIへの指示（省略可）
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="例: もっと具体的に書いて　/　保護者向けに柔らかく"
            className="w-full border border-violet-200 bg-white rounded-lg px-3 py-2
                       text-sm resize-none min-h-[72px] focus:outline-none
                       focus:ring-2 focus:ring-violet-400 break-anywhere"
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="ai"
              size="sm"
              fullWidth
              loading={isRegen}
              onClick={handleRegen}
            >
              <Sparkles size={14} />
              AIに修正させる
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setShowAI(false); setInstruction('') }}
            >
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAI(true)}
          className="mt-2 text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1
                     px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200
                     rounded-lg transition-colors min-h-[36px]"
        >
          <Sparkles size={12} />
          このパラグラフをAIに修正させる
        </button>
      )}
    </Card>
  )
}

// ==============================
// ステータスアクションバー
// ==============================
const StatusActionBar: React.FC<{
  status: ReportStatus
  onStatusChange: (s: ReportStatus) => void
  onExportPDF: () => void
}> = ({ status, onStatusChange, onExportPDF }) => {
  const { label, color } = STATUS_CONFIG[status]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{label}</span>

      {status === 'draft' && (
        <Button size="sm" variant="primary" onClick={() => onStatusChange('reviewing')}>
          レビューを依頼する
        </Button>
      )}
      {status === 'reviewing' && (
        <>
          <Button size="sm" variant="primary" onClick={() => onStatusChange('approved')}>
            <CheckCircle size={14} />
            承認する
          </Button>
          <Button size="sm" variant="danger" onClick={() => onStatusChange('rejected')}>
            修正を依頼する（差し戻し）
          </Button>
        </>
      )}
      {status === 'rejected' && (
        <Button size="sm" variant="secondary" onClick={() => onStatusChange('reviewing')}>
          <RotateCcw size={14} />
          修正して再依頼する
        </Button>
      )}
      {status === 'approved' && (
        <Button size="sm" variant="secondary" onClick={onExportPDF}>
          <FileDown size={14} />
          PDFで出力する
        </Button>
      )}
    </div>
  )
}

// ==============================
// AIパネル
// ==============================
const AIPanel: React.FC<{
  missingInfo: string[]
  suggestions: string[]
  onStyleChange: (style: string) => void
}> = ({ missingInfo, suggestions, onStyleChange }) => {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles size={14} className="text-violet-500" />
          AI サポートパネル
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* 不足情報 */}
          {missingInfo.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-2">
                <AlertTriangle size={12} />
                確認が必要な点
              </p>
              <ul className="space-y-1">
                {missingInfo.map((info, i) => (
                  <li key={i} className="text-xs text-orange-600 break-anywhere leading-relaxed pl-3 border-l-2 border-orange-300">
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 提案 */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                <Lightbulb size={12} />
                AIからの提案
              </p>
              <ul className="space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-blue-600 break-anywhere leading-relaxed pl-3 border-l-2 border-blue-300">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 文体変換 */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">文体を変換する</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '園内共有向け', value: 'internal' },
                { label: '保護者向け', value: 'guardian' },
                { label: '行政提出向け', value: 'government' },
                { label: '監査説明向け', value: 'audit' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStyleChange(s.value)}
                  className="text-xs px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 min-h-[36px] break-anywhere transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================
// メインページ
// ==============================
export const ReportEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const report = DEMO_REPORTS.find((r) => r.id === id) ?? DEMO_REPORTS[0]
  const [status, setStatus] = useState<ReportStatus>(report.status)
  const [content, setContent] = useState(DEMO_REPORT_CONTENT)
  const [showPDFModal, setShowPDFModal] = useState(false)

  const handleSectionChange = (sectionId: string, body: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, body, last_edited_by: 'human' as const, ai_generated: false }
          : s
      ),
    }))
  }

  const handleRegenerate = async (sectionId: string, instruction: string) => {
    await new Promise((r) => setTimeout(r, 1500))
    const demoTexts: Record<string, string> = {
      s1: `【AIにより修正】本月の安全確認は計画通り着実に進められました。全${content.sections.length}セクションの確認項目のうち、主要項目については予定通り完了しております。${instruction ? `（指示: ${instruction}）` : ''}`,
      s3: `未実施となった項目については、今月末までに担当者が対応予定です。進捗は翌月報告時に反映いたします。${instruction ? `（指示: ${instruction}）` : ''}`,
    }
    const newBody = demoTexts[sectionId] ?? `AIにより修正されました。${instruction ? `（指示: ${instruction}）` : ''}`
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, body: newBody, last_edited_by: 'ai' as const, ai_generated: true }
          : s
      ),
    }))
    toast.success('AIが修正しました。内容を確認してください')
  }

  const handleStatusChange = (newStatus: ReportStatus) => {
    setStatus(newStatus)
    const messages: Record<ReportStatus, string> = {
      reviewing: 'レビュー依頼しました',
      approved: '承認しました ✓',
      rejected: '差し戻しました',
      draft: '下書きに戻しました',
    }
    toast.success(messages[newStatus])
  }

  return (
    <div className="px-4 py-6 pb-safe max-w-4xl mx-auto">
      {/* ステータスバー（sticky） */}
      <div className="sticky top-0 z-10 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 mb-5">
        <h1 className="text-sm font-bold text-gray-900 break-anywhere mb-2">{content.title}</h1>
        <StatusActionBar
          status={status}
          onStatusChange={handleStatusChange}
          onExportPDF={() => setShowPDFModal(true)}
        />
      </div>

      {/* 差し戻し通知 */}
      {status === 'rejected' && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 break-anywhere">
            この報告書は差し戻されました。内容を修正してから再度レビューを依頼してください。
          </p>
        </div>
      )}

      {/* PC: 2カラム / Mobile: 縦積み */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* 本文エディタ */}
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="報告書の内容"
            subtitle="各セクションを自由に編集できます"
          />
          {content.sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onChange={handleSectionChange}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>

        {/* AIパネル */}
        <div className="lg:w-72 shrink-0">
          <AIPanel
            missingInfo={content.missing_info}
            suggestions={content.suggestions}
            onStyleChange={(style) => toast.success(`文体を「${style}」に変換しました（デモ）`)}
          />

          {/* 版管理 */}
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">版管理</p>
            <div className="space-y-2">
              {[
                { version: 2, label: '現在の版（手動編集）', current: true },
                { version: 1, label: 'AI初回下書き', current: false },
              ].map((v) => (
                <div key={v.version} className={`text-xs rounded-lg px-3 py-2 ${v.current ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <span className={`font-medium ${v.current ? 'text-blue-700' : 'text-gray-600'}`}>
                    v{v.version}
                  </span>
                  <span className="text-gray-500 ml-2">{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PDF出力モーダル */}
      <Modal open={showPDFModal} onClose={() => setShowPDFModal(false)} title="PDF出力">
        <p className="text-sm text-gray-700 mb-4 break-anywhere">
          「{content.title}」をPDFとして出力します。
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500">
            ※ このデモ版ではPDFのダウンロードは行いません。<br />
            本番環境ではSupabase Edge FunctionまたはReact PDFで生成されます。
          </p>
        </div>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            setShowPDFModal(false)
            toast.success('PDF出力機能は本番環境で利用できます')
          }}
        >
          <FileDown size={16} />
          PDFをダウンロードする
        </Button>
      </Modal>

      <div className="h-6" />
    </div>
  )
}

export default ReportEditPage
