import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, CreditCard, TrendingDown, ChevronRight } from 'lucide-react'
import { formatCurrency, getInitials } from '../utils/formatters'

export default function BorrowerCard({ borrower, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <Link to={`/borrowers/${borrower.id}`} className="card block p-4 sm:p-5 pr-12 flex items-start gap-3 sm:gap-4 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-200 group">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-brand-500/20">
          {getInitials(borrower.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">{borrower.name}</h3>
            {borrower.overdueCount > 0 && (
              <span className="badge-overdue">{borrower.overdueCount} overdue</span>
            )}
          </div>
          {borrower.phone && <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{borrower.phone}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CreditCard size={12} />
              {borrower.activeLoans} active
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown size={12} />
              {formatCurrency(borrower.outstanding, true)} due
            </span>
          </div>
        </div>

        <ChevronRight size={16} className="mt-1 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  )
}
