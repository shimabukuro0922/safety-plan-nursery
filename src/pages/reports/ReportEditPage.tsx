import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  Lightbulb, CheckCircle, RotateCcw, FileDown, Save,
} from 'lucide-react'
import { Card, Button, SectionHeader } from '@/components/ui'
import { useReportStore } from '@/stores/appStore'
import type { ReportStatus, ReportSection, ReportContent } from '@/types'
import { STATUS_CONFIG } from '@/types'
import { exportToPDF } from '@/lib/exportPDF'
import toast from 'react-hot-toast'

// ==============================
// セクションエディタ
// ==============================
const SectionEditor: React.FC<{
  section: ReportSection
  onChange: (id: string, body: string) => void
}> = ({ section, onChange }) => {
  return (
    <Card className="p-4 mb-3">
      <div className="flex items-start gap-2 mb-2">
        <h3 className="text-sm font-bold text-gray-900 flex-1 break-anywhere">{section.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          section.last_edited_by === 'ai'
            ? 'bg-violet-100 text-violet-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {section.last_edited_by === 'ai' ? '✨ 自動生成' : '✏️ 手動編集'}
        </span>
      </div>
      <textarea
        value={section.body}
        onChange={(e) => onChange(section.id, e.target.value)}
        placeholder="ここに内容を入力してください"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                   resize-none min-h-[120px] leading-relaxed break-anywhere
                   focus:ring-2 focus:ring-blue-500 focus:outline-none
                   text-gray-800 placeholder:text-gray-400"
      />
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
  onSave: () => void
  exporting?: boolean
}> = ({ status, onStatusChange, onExportPDF, onSave, exporting }) => {
  const { label, color } = STATUS_CONFIG[status]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{label}</span>

      <Button size="sm" variant="secondary" onClick={onSave}>
        <Save size={14} />
        保存する
      </Button>

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
            差し戻し
          </Button>
        </>
      )}
      {status === 'rejected' && (
        <Button size="sm" variant="secondary" onClick={() => onStatusChange('reviewing')}>
          <RotateCcw size={14} />
          修正して再依頼
        </Button>
      )}
      {status === 'approved' && (
        <Button size="sm" variant="secondary" loading={exporting} onClick={onExportPDF}>
          <FileDown size={14} />
          {exporting ? 'PDF生成中...' : 'PDFで出力する'}
        </Button>
      )}
    </div>
  )
}

// ==============================
// AIパネル
// ==============================
const AIPanel: React.FC<{
  suggestions: string[]
}> = ({ suggestions }) => {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles size={14} className="text-violet-500" />
          編集のヒント
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {suggestions.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                <Lightbulb size={12} />
                アドバイス
              </p>
              <ul className="space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-blue-600 break-anywhere leading-relaxed pl-3 border-l-2 border-blue-300">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
                <Lightbulb size={12} />
                記入のヒント
              </p>
              <ul className="space-y-1.5">
                {[
                  '「実施概要」には実施した月と主な安全確認の概要を書きます',
                  '「実施済み項目」には完了したチェック項目と担当者名を書きます',
                  '「未実施項目」には理由と次回対応予定を明記しましょう',
                  '「次月の取り組み」には重点的に行う安全活動を書きます',
                ].map((hint, i) => (
                  <li key={i} className="text-xs text-blue-600 break-anywhere leading-relaxed pl-3 border-l-2 border-blue-300">
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
  const { reports, updateReportStatus, updateReportContent } = useReportStore()

  const report = reports.find((r) => r.id === id)

  useEffect(() => {
    if (!report) {
      toast.error('報告書が見つかりません')
      navigate('/reports')
    }
  }, [report, navigate])

  const [status, setStatus] = useState<ReportStatus>(report?.status ?? 'draft')
  const [content, setContent] = useState<ReportContent>(
    report?.content ?? { title: '', sections: [], missing_info: [], suggestions: [] }
  )
  const [exportingPDF, setExportingPDF] = useState(false)
  const printAreaRef = useRef<HTMLDivElement>(null)
  // 未保存の編集中は同期でコンテンツを上書きしない
  const isDirtyRef = useRef(false)

  // 別デバイスからの同期でstoreが更新されたとき、ローカルstateに反映する
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (report) setStatus(report.status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.status])

  useEffect(() => {
    // isDirty の場合（ユーザーが編集中）は同期で上書きしない
    if (report && !isDirtyRef.current) setContent(report.content)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.id, report?.updated_at])

  if (!report) return null

  const handleSectionChange = (sectionId: string, body: string) => {
    isDirtyRef.current = true  // 編集開始フラグ
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, body, last_edited_by: 'human' as const, ai_generated: false }
          : s
      ),
    }))
  }

  const handleSave = () => {
    if (!id) return
    isDirtyRef.current = false  // 保存完了でフラグをリセット
    updateReportContent(id, content)
    toast.success('保存しました')
  }

  const handleStatusChange = (newStatus: ReportStatus) => {
    isDirtyRef.current = false
    updateReportContent(id!, content)
    updateReportStatus(id!, newStatus)
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
          onExportPDF={async () => {
        if (!printAreaRef.current) return
        setExportingPDF(true)
        try {
          await exportToPDF(printAreaRef.current, {
            filename: content.title || '安全管理報告書',
            onProgress: (p) => { if (p === 100) toast.success('PDFを保存しました') },
          })
        } catch (e) {
          console.error('PDF生成エラー:', e)
          const msg = e instanceof Error ? e.message : String(e)
          toast.error(`PDF生成に失敗しました: ${msg}`)
        } finally {
          setExportingPDF(false)
        }
      }}
          onSave={handleSave}
          exporting={exportingPDF}
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
            subtitle="各セクションに内容を入力してください"
          />
          {/* PDF出力対象エリア（セクション本文のみ） */}
          <div ref={printAreaRef}>
            {content.sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={handleSectionChange}
              />
            ))}
          </div>
          <Button variant="primary" fullWidth onClick={handleSave}>
            <Save size={16} />
            変更を保存する
          </Button>
        </div>

        {/* ヒントパネル */}
        <div className="lg:w-72 shrink-0">
          <AIPanel suggestions={content.suggestions} />
        </div>
      </div>

      <div className="h-6" />
    </div>
  )
}

export default ReportEditPage
