import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

export default function KPICard({ title, value, isCurrency = true, trend, icon: Icon, color = 'brand', index = 0 }) {
  const colorMap = {
    brand:  'from-brand-500 to-teal-500 shadow-brand-500/20',
    blue:   'from-blue-500 to-indigo-500 shadow-blue-500/20',
    amber:  'from-amber-500 to-orange-500 shadow-amber-500/20',
    red:    'from-red-500 to-rose-500 shadow-red-500/20',
    violet: 'from-violet-500 to-purple-500 shadow-violet-500/20',
    teal:   'from-teal-500 to-cyan-500 shadow-teal-500/20',
  }

  const displayValue = isCurrency ? formatCurrency(value, true) : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="card min-w-0 p-3.5 sm:p-5 flex flex-col gap-2.5 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className="h-4.5 w-4.5 text-white" />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
            ${trend > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
              trend < 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
              'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
          >
            {trend > 0 ? <TrendingUp size={9} /> : trend < 0 ? <TrendingDown size={9} /> : <Minus size={9} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.12em]">{title}</p>
        <p className="mt-0.5 truncate text-lg font-bold text-slate-900 dark:text-white leading-tight">{displayValue}</p>
      </div>
    </motion.div>
  )
}
