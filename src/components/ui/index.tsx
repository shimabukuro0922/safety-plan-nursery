import React from 'react'
import type { ReportStatus, ChecklistItemStatus } from '@/types'
import { STATUS_CONFIG, CHECKLIST_STATUS_CONFIG } from '@/types'

// ==============================
// Badge / Status
// ==============================
export const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const { label, color } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

export const CheckStatusBadge: React.FC<{ status: ChecklistItemStatus }> = ({ status }) => {
  const { label, color } = CHECKLIST_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

// ==============================
// Card
// ==============================
export const Card: React.FC<{
  children: React.ReactNode
  className?: string
  onClick?: () => void
}> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-white border border-gray-200 rounded-xl ${onClick ? 'cursor-pointer active:bg-gray-50' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
)

// ==============================
// Button
// ==============================
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

const VARIANT_CLASSES: Record<BtnVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300',
  ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  ai: 'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800',
}
const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-5 py-3 text-base min-h-[52px]',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center gap-2 font-medium rounded-xl
      transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed
      ${VARIANT_CLASSES[variant]}
      ${SIZE_CLASSES[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `}
  >
    {loading ? (
      <>
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        処理中...
      </>
    ) : children}
  </button>
)

// ==============================
// Empty State
// ==============================
export const EmptyState: React.FC<{
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && <div className="text-gray-300 mb-4">{icon}</div>}
    <p className="text-base font-medium text-gray-700 mb-1">{title}</p>
    {description && (
      <p className="text-sm text-gray-500 mb-6 max-w-xs break-anywhere">{description}</p>
    )}
    {action && (
      <Button variant="primary" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
)

// ==============================
// Progress Bar
// ==============================
export const ProgressBar: React.FC<{
  done: number
  total: number
  className?: string
}> = ({ done, total, className = '' }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{done} / {total} 件完了</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ==============================
// Summary Card
// ==============================
export const SummaryCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: number | string
  unit?: string
  urgent?: boolean
  onClick?: () => void
  className?: string
}> = ({ icon, label, value, unit, urgent, onClick, className = '' }) => (
  <Card
    className={`p-4 ${urgent ? 'border-red-300 bg-red-50' : ''} ${className}`}
    onClick={onClick}
  >
    <div className="flex items-start gap-2">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 break-anywhere">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
          {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  </Card>
)

// ==============================
// Modal
// ==============================
export const Modal: React.FC<{
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}> = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ==============================
// Loading Spinner
// ==============================
export const LoadingSpinner: React.FC<{ text?: string }> = ({ text = '読み込み中...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-gray-500">{text}</p>
  </div>
)

// ==============================
// Section Header
// ==============================
export const SectionHeader: React.FC<{
  title: string
  subtitle?: string
  action?: React.ReactNode
}> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h2 className="text-base font-bold text-gray-900 break-anywhere">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 break-anywhere">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)
