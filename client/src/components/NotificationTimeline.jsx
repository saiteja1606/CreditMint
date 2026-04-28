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
            whileTap={{ scale: 0.98 }}
            className={`flex gap-4 p-4 rounded-[28px] border transition-all cursor-pointer active:bg-slate-50 dark:active:bg-slate-900/40
              ${n.isRead
                ? 'border-slate-100 dark:border-slate-700/50'
                : 'border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-900/10'
              }`}
            onClick={() => !n.isRead && onMarkRead(n.id)}
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-[20px] ${cfg.bg} flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-white dark:ring-slate-800`}>
              <Icon size={20} className={cfg.color} />
            </div>
 
            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`text-sm leading-relaxed ${n.isRead ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-900 dark:text-slate-100 font-bold'}`}>
                {n.message}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{timeAgo(n.createdAt)}</p>
            </div>
 
            {/* Unread dot */}
            {!n.isRead && (
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500 flex-shrink-0 shadow-lg shadow-brand-500/50" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
