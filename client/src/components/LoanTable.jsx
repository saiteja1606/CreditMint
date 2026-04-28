import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from './StatusBadge'
import { formatCurrency, formatDate, dueDaysLabel } from '../utils/formatters'
import { 
  MoreVertical, Eye, Pencil, Trash2, Wallet, 
  Percent, ChevronRight, Phone 
} from 'lucide-react'

const progress = (paid, total) => total > 0 ? Math.min(100, (paid / total) * 100) : 0

export default function LoanTable({ loans, onPay, onCollectInterest, onEdit, onDelete, showBorrower = true }) {
  const [activeMenu, setActiveMenu] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loans.length === 0) return null

  return (
    <>
      <div className="space-y-3 p-3 md:hidden">
        {loans.map((loan, i) => {
          const remaining = loan.collectableAmount ?? (loan.totalAmount - loan.paidAmount)
          const pct = progress(loan.paidAmount, loan.totalAmount)
          const isMenuOpen = activeMenu === loan.id

          const isLastItem = i >= loans.length - 2 && loans.length > 3
          return (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {showBorrower ? (
                    <Link to={`/borrowers/${loan.borrowerId}`} className="block truncate text-base font-bold text-slate-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                      {loan.borrower?.name}
                    </Link>
                  ) : (
                    <p className="truncate text-base font-bold text-slate-900 dark:text-white">
                      {loan.borrower?.name || 'Loan'}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <StatusBadge status={loan.status} />
                    <span>•</span>
                    <span>Due {formatDate(loan.dueDate)}</span>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(isMenuOpen ? null : loan.id)}
                    className={`p-2 rounded-xl transition-colors ${isMenuOpen ? 'bg-slate-100 dark:bg-slate-700 text-brand-600' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-400'}`}
                  >
                    <MoreVertical size={20} />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.95, y: isLastItem ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: isLastItem ? 10 : -10 }}
                        className={`absolute right-0 z-50 w-52 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 ${isLastItem ? 'bottom-11' : 'top-11'}`}
                      >
                        <Link 
                          to={`/loans/${loan.id}`}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Eye size={16} className="text-slate-400" />
                          View Details
                        </Link>
                        
                        {loan.status !== 'PAID' && (
                          <button
                            onClick={() => { onPay(loan); setActiveMenu(null) }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                          >
                            <Wallet size={16} />
                            Record Payment
                          </button>
                        )}

                        {loan.status !== 'PAID' && loan.interestType === 'MONTHLY' && onCollectInterest && (
                          <button
                            onClick={() => { onCollectInterest(loan); setActiveMenu(null) }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          >
                            <Percent size={16} />
                            Collect Interest
                          </button>
                        )}

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        {typeof onEdit === 'function' && (
                          <button
                            onClick={() => { onEdit(loan); setActiveMenu(null) }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            <Pencil size={16} />
                            Edit Loan
                          </button>
                        )}

                        {typeof onDelete === 'function' && (
                          <button
                            onClick={() => { onDelete(loan.id); setActiveMenu(null) }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={16} />
                            Delete Loan
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700/30 dark:bg-slate-700/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Principal</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(loan.amount)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-700/30 dark:bg-slate-700/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining</p>
                  <p className={`mt-1 text-sm font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-500">{Math.round(pct)}% Repaid</span>
                  <span className="text-slate-400">{formatCurrency(loan.paidAmount)} collected</span>
                </div>
                <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div 
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-teal-500 transition-all duration-500 shadow-glow" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
                {loan.overdueInterest > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-900/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      LATE INTEREST: +{formatCurrency(loan.overdueInterest)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="hidden overflow-visible md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {showBorrower && <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Borrower</th>}
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Principal</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Need to Collect</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Progress</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Due Date</th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan, i) => {
            const remaining = loan.collectableAmount ?? (loan.totalAmount - loan.paidAmount)
            const pct = progress(loan.paidAmount, loan.totalAmount)
            const isLastItem = i >= loans.length - 2 && loans.length > 3
            return (
              <motion.tr
                key={loan.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                {showBorrower && (
                  <td className="py-3.5 px-4">
                    <Link to={`/borrowers/${loan.borrowerId}`} className="font-medium text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                      {loan.borrower?.name}
                    </Link>
                    <p className="text-xs text-slate-400">{loan.borrower?.phone}</p>
                  </td>
                )}
                <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(loan.amount)}</td>
                <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(loan.totalAmount)}</td>
                <td className="py-3.5 px-4 text-right font-semibold hidden md:table-cell">
                  <span className={remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    {formatCurrency(remaining)}
                  </span>
                  {loan.overdueInterest > 0 && (
                    <p className="text-[11px] text-amber-500 mt-0.5">+{formatCurrency(loan.overdueInterest)} late</p>
                  )}
                </td>
                <td className="py-3.5 px-4 hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 hidden md:table-cell">
                  <p className="text-slate-700 dark:text-slate-300 text-xs">{formatDate(loan.dueDate)}</p>
                  <p className={`text-xs ${loan.status === 'OVERDUE' ? 'text-red-500' : 'text-slate-400'}`}>{dueDaysLabel(loan.dueDate)}</p>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <StatusBadge status={loan.status} />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="relative inline-block text-left">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === loan.id ? null : loan.id)}
                      className={`p-2 rounded-xl transition-all ${activeMenu === loan.id ? 'bg-slate-100 dark:bg-slate-700 text-brand-600' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-400'}`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {activeMenu === loan.id && (
                        <motion.div
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.95, y: isLastItem ? 10 : -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: isLastItem ? 10 : -10 }}
                          className={`absolute right-0 z-50 w-52 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 ${isLastItem ? 'bottom-11' : 'top-11'}`}
                        >
                          <Link 
                            to={`/loans/${loan.id}`}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Eye size={16} className="text-slate-400" />
                            View Details
                          </Link>
                          
                          {loan.status !== 'PAID' && (
                            <button
                              onClick={() => { onPay(loan); setActiveMenu(null) }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                            >
                              <Wallet size={16} />
                              Record Payment
                            </button>
                          )}

                          {loan.status !== 'PAID' && loan.interestType === 'MONTHLY' && onCollectInterest && (
                            <button
                              onClick={() => { onCollectInterest(loan); setActiveMenu(null) }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                            >
                              <Percent size={16} />
                              Collect Interest
                            </button>
                          )}

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                          {typeof onEdit === 'function' && (
                            <button
                              onClick={() => { onEdit(loan); setActiveMenu(null) }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <Pencil size={16} />
                              Edit Loan
                            </button>
                          )}

                          {typeof onDelete === 'function' && (
                            <button
                              onClick={() => { onDelete(loan.id); setActiveMenu(null) }}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2 size={16} />
                              Delete Loan
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </>
  )
}
