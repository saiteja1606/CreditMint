import { useEffect, useState } from 'react'
import Modal from './Modal'
import { formatCurrency, formatDate } from '../utils/formatters'

const getMonthlyInterestAmount = (loan) => {
  if (!loan) return 0
  return loan.monthlyInterestAmount ?? (Math.round(((loan.amount * loan.interestRate) / 100) * 100) / 100)
}

const getNextDueDate = (loan) => {
  if (!loan?.dueDate) return null
  const next = new Date(loan.dueDate)
  next.setMonth(next.getMonth() + 1)
  return next
}

export default function InterestCollectionModal({ isOpen, onClose, loan, onCollect }) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setNote('')
    }
  }, [isOpen, loan?.id])

  const handleClose = () => {
    setNote('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!loan) return

    setSubmitting(true)
    try {
      await onCollect(loan.id, { note })
      setSubmitting(false)
      handleClose()
    } catch {
      // toast handled by caller
    } finally {
      setSubmitting(false)
    }
  }

  const interestAmount = getMonthlyInterestAmount(loan)
  const nextDueDate = getNextDueDate(loan)
  const overdueInterest = loan?.overdueInterest ?? 0
  const collectNow = interestAmount + overdueInterest

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Collect Monthly Interest" size="sm">
      {loan && (
        <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm space-y-1 dark:bg-slate-700/50">
          <div className="flex justify-between">
            <span className="text-slate-500">Borrower</span>
            <span className="font-medium text-slate-900 dark:text-white">{loan.borrower?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Monthly Interest</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(interestAmount)}</span>
          </div>
          {overdueInterest > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Late Interest</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(overdueInterest)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Current Due Date</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatDate(loan.dueDate)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1">
            <span className="text-slate-500 font-medium">Collect Now</span>
            <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(collectNow)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Next Due Date</span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{nextDueDate ? formatDate(nextDueDate) : '-'}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Monthly interest collected"
            className="input-base"
          />
        </div>

        <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-2">
          <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !loan} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-brand-500/25">
            {submitting ? 'Collecting...' : 'Collect Interest'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
