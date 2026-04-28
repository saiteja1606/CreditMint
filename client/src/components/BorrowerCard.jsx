import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, CreditCard, TrendingDown, ChevronRight, Phone } from 'lucide-react'
import { formatCurrency, getInitials } from '../utils/formatters'

export default function BorrowerCard({ borrower, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileTap={{ scale: 0.98 }}
      className="group relative"
    >
      <Link to={`/borrowers/${borrower.id}`} className="card block overflow-hidden rounded-[24px] p-5 pr-14 transition-all duration-200 active:bg-slate-50 dark:active:bg-slate-900/40">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-14 w-14 shrink-0 rounded-[20px] gradient-brand flex items-center justify-center text-white font-black text-lg shadow-xl shadow-brand-500/30 ring-4 ring-white dark:ring-slate-800">
            {getInitials(borrower.name)}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-900 dark:text-white leading-tight">{borrower.name}</h3>
            {borrower.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <Phone size={10} className="text-slate-300" />
                {borrower.phone}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-900/50">
                <CreditCard size={12} className="text-brand-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{borrower.activeLoans} Loans</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-900/50">
                <TrendingDown size={12} className="text-rose-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{formatCurrency(borrower.outstanding, true)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-transform group-hover:translate-x-1">
          <ChevronRight size={20} />
        </div>
      </Link>
    </motion.div>
  )
}
