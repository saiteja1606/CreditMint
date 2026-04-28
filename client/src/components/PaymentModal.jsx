import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import { paymentSchema } from '../validations/schemas'
import { formatCurrency } from '../utils/formatters'
import { DollarSign } from 'lucide-react'

export default function PaymentModal({ isOpen, onClose, loan, onPay }) {
  const remaining = loan ? (loan.collectableAmount ?? (loan.totalAmount - loan.paidAmount)) : 0
  const overdueInterest = loan?.overdueInterest ?? 0

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: '', note: '' },
  })

  const onSubmit = async (data) => {
    try {
      await onPay(loan.id, data)
      reset()
      onClose()
    } catch (err) {
      // toast handled by hook
    }
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Payment" size="sm">
      {loan && (
        <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm space-y-1 dark:bg-slate-700/50">
          <div className="flex justify-between">
            <span className="text-slate-500">Borrower</span>
            <span className="font-medium text-slate-900 dark:text-white">{loan.borrower?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Amount</span>
            <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(loan.totalAmount)}</span>
          </div>
          {overdueInterest > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Overdue Interest</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(overdueInterest)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Paid So Far</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(loan.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1">
            <span className="text-slate-500 font-medium">Need to Collect</span>
            <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(remaining)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-base">Payment Amount (₹)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              placeholder={`Max: ${remaining.toFixed(2)}`}
              className="input-base pl-9"
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="label-base">Note (optional)</label>
          <input {...register('note')} type="text" placeholder="e.g. Part 1, EMI, etc." className="input-base" />
        </div>

        <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-2">
          <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-brand-500/25">
            {isSubmitting ? 'Recording…' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
