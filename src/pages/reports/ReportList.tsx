import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, ChevronRight, Trash2 } from 'lucide-react'
import { Card, Button, EmptyState, SectionHeader } from '@/components/ui'
import { useReportStore } from '@/stores/appStore'
import { REPORT_TYPE_LABELS, STATUS_CONFIG } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'

export const ReportList: React.FC = () => {
  const navigate = useNavigate()
  const { reports, deleteReport } = useReportStore()

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    if (window.confirm(`「${title}」を削除しますか？`)) {
      deleteReport(id)
      toast.success('報告書を削除しました')
    }
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <SectionHeader
        title="報告書"
        subtitle="作成した報告書の一覧です"
        action={
          <Button variant="primary" size="sm" onClick={() => navigate('/reports/new')}>
            <Plus size={14} />
            新規作成
          </Button>
        }
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="報告書がまだありません"
          description="「新規作成」から月次報告書や研修記録を作成できます"
          action={{ label: '報告書を作成する', onClick: () => navigate('/reports/new') }}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const { label, color } = STATUS_CONFIG[r.status]
            return (
              <Card
                key={r.id}
                className="p-4 cursor-pointer"
                onClick={() => navigate(`/reports/${r.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <p className="text-sm font-semibold text-gray-900 break-anywhere">{r.title}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{REPORT_TYPE_LABELS[r.report_type]}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      更新: {format(new Date(r.updated_at), 'M月d日 HH:mm', { locale: ja })}
                      {' '}v{r.current_version}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, r.id, r.title)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-gray-400" />
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

export default ReportList
