import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

const config = {
  PENDING: {
    label: 'Pending',
    className: 'badge-pending',
    Icon: Clock,
  },
  PAID: {
    label: 'Paid',
    className: 'badge-paid',
    Icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'badge-overdue',
    Icon: AlertTriangle,
  },
}

export default function StatusBadge({ status }) {
  const { label, className, Icon } = config[status] || config.PENDING
  return (
    <span className={className}>
      <Icon size={11} />
      {label}
    </span>
  )
}
