import { motion } from 'framer-motion'
import { Bell, CheckCircle2, AlertTriangle, Clock, CreditCard, Coins } from 'lucide-react'
import { timeAgo, formatCurrency } from '../utils/formatters'

const typeConfig = {
  DUE_TOMORROW: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  DUE_TODAY: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  OVERDUE: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  PAYMENT_RECEIVED: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  LOAN_CREATED: { icon: Coins, color: 'text-brand-500', bg: 'bg-brand-100 dark:bg-brand-900/30' },
}

export default function NotificationTimeline({ notifications, onMarkRead }) {
  return (
    <div className="space-y-3 sm:space-y-3.5">
      {notifications.map((n, i) => {
        const cfg = typeConfig[n.type] || typeConfig.LOAN_CREATED
        const Icon = cfg.icon
        return (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex gap-3 sm:gap-4 p-4 sm:p-4.5 rounded-[22px] border transition-all cursor-pointer group shadow-sm
              ${n.isRead
                ? 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                : 'border-brand-200 dark:border-brand-800/50 bg-brand-50/70 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              }`}
            onClick={() => !n.isRead && onMarkRead(n.id)}
          >
            {/* Icon */}
            <div className={`w-11 h-11 rounded-2xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={cfg.color} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-6 ${n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100 font-medium'}`}>
                {n.message}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-400">{timeAgo(n.createdAt)}</p>
            </div>

            {/* Unread dot */}
            {!n.isRead && (
              <div className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-500 flex-shrink-0" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
