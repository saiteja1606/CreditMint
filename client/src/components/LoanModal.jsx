import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import { loanSchema } from '../validations/schemas'
import { toInputDate, formatCurrency } from '../utils/formatters'
import api from '../services/api'
import { AlertCircle } from 'lucide-react'
// Client-side interest preview
const calcPreview = (amount, rate, type, startDate, dueDate) => {
  if (!amount || !startDate || !dueDate) return null
  const a = parseFloat(amount) || 0
  const r = parseFloat(rate) || 0
  const sd = new Date(startDate)
  const dd = new Date(dueDate)
  if (isNaN(sd) || isNaN(dd) || dd < sd) return null

  const diffDays = (dd - sd) / (1000 * 60 * 60 * 24)
  let interest = 0
  if (type === 'SIMPLE') {
    interest = (a * r) / 100
  } else {
    const months = Math.max(1, ((dd.getFullYear() - sd.getFullYear()) * 12) + (dd.getMonth() - sd.getMonth()))
    interest = (a * r * months) / 100
  }
  return { interest: Math.round(interest * 100) / 100, total: Math.round((a + interest) * 100) / 100 }
}

export default function LoanModal({ isOpen, onClose, loan, borrowers, onSave }) {
  const isEdit = !!loan
  const [walletBalance, setWalletBalance] = useState(null)

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      borrowerId: '', amount: '', interestRate: 0, interestType: 'SIMPLE',
      startDate: toInputDate(new Date()), dueDate: '', notes: '', reminderEnabled: true,
    },
  })

  useEffect(() => {
    if (loan) {
      reset({
        borrowerId: loan.borrowerId,
        amount: loan.amount,
        interestRate: loan.interestRate,
        interestType: loan.interestType,
        startDate: toInputDate(loan.startDate),
        dueDate: toInputDate(loan.dueDate),
        notes: loan.notes || '',
        reminderEnabled: loan.reminderEnabled,
      })
    } else {
      reset({ borrowerId: '', amount: '', interestRate: 0, interestType: 'SIMPLE', startDate: toInputDate(new Date()), dueDate: '', notes: '', reminderEnabled: true })
    }
  }, [loan, isOpen])

  useEffect(() => {
    if (isOpen && !isEdit) {
      api.get('/wallet/summary').then(res => setWalletBalance(res.data.data.summary.walletBalance)).catch(() => {})
    }
  }, [isOpen, isEdit])

  const [amount, interestRate, interestType, startDate, dueDate] = watch(['amount', 'interestRate', 'interestType', 'startDate', 'dueDate'])
  const preview = useMemo(() => calcPreview(amount, interestRate, interestType, startDate, dueDate), [amount, interestRate, interestType, startDate, dueDate])

  const onSubmit = async (data) => {
    try {
      await onSave(data, isEdit ? loan.id : null)
      reset()
      onClose()
    } catch {}
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit Loan' : 'New Loan'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Borrower */}
        <div>
          <label className="label-base">Borrower *</label>
          <select {...register('borrowerId')} className="input-base">
            <option value="">Select borrower…</option>
            {borrowers.map(b => (
              <option key={b.id} value={b.id}>{b.name} {b.phone ? `(${b.phone})` : ''}</option>
            ))}
          </select>
          {errors.borrowerId && <p className="text-xs text-red-500 mt-1">{errors.borrowerId.message}</p>}
        </div>

        {/* Amount & Interest Rate */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="label-base">Principal Amount (₹) *</label>
              {walletBalance !== null && !isEdit && (
                <span className="text-[10px] font-semibold text-slate-400">Available: {formatCurrency(walletBalance)}</span>
              )}
            </div>
            <input {...register('amount')} type="number" step="0.01" min="1" placeholder="50000" className={`input-base ${walletBalance !== null && amount > walletBalance && !isEdit ? 'border-red-300 ring-red-500/10' : ''}`} />
            {walletBalance !== null && amount > walletBalance && !isEdit && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                <AlertCircle size={14} />
                <span>Insufficient wallet balance</span>
              </div>
            )}
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="label-base">Interest Rate (%)</label>
            <input {...register('interestRate')} type="number" step="0.01" min="0" placeholder="12" className="input-base" />
            {errors.interestRate && <p className="text-xs text-red-500 mt-1">{errors.interestRate.message}</p>}
          </div>
        </div>

        {/* Interest Type */}
        <div>
          <label className="label-base">Interest Type</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            {[{ val: 'SIMPLE', label: 'Simple (Flat %)' }, { val: 'MONTHLY', label: 'Monthly' }].map(opt => (
              <label key={opt.val} className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700 cursor-pointer">
                <input {...register('interestType')} type="radio" value={opt.val} className="h-4 w-4 accent-brand-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-base">Start Date *</label>
            <input {...register('startDate')} type="date" className="input-base" />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="label-base">Due Date *</label>
            <input {...register('dueDate')} type="date" className="input-base" />
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
          </div>
        </div>

        {/* Interest Preview */}
        {preview && (
          <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 text-sm flex items-center gap-4">
            <div className="flex-1">
              <span className="text-brand-600 dark:text-brand-400">Interest: </span>
              <strong className="text-brand-700 dark:text-brand-300">{formatCurrency(preview.interest)}</strong>
            </div>
            <div className="flex-1">
              <span className="text-brand-600 dark:text-brand-400">Total: </span>
              <strong className="text-brand-700 dark:text-brand-300">{formatCurrency(preview.total)}</strong>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label-base">Notes (optional)</label>
          <textarea {...register('notes')} rows={2} placeholder="Any additional notes…" className="input-base resize-none" />
        </div>

        {/* Reminder */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input {...register('reminderEnabled')} type="checkbox" className="w-4 h-4 accent-brand-500" />
          <span className="text-sm text-slate-700 dark:text-slate-300">Enable automatic reminders for this loan</span>
        </label>

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/95 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-2">
          <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-brand-500/25">
            {isSubmitting ? 'Saving…' : isEdit ? 'Update Loan' : 'Create Loan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
