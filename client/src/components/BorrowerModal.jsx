import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import { borrowerSchema } from '../validations/schemas'

export default function BorrowerModal({ isOpen, onClose, borrower, onSave }) {
  const isEdit = !!borrower

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(borrowerSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', notes: '' },
  })

  useEffect(() => {
    if (borrower) {
      reset({ name: borrower.name, phone: borrower.phone || '', email: borrower.email || '', address: borrower.address || '', notes: borrower.notes || '' })
    } else {
      reset({ name: '', phone: '', email: '', address: '', notes: '' })
    }
  }, [borrower, isOpen])

  const onSubmit = async (data) => {
    try {
      await onSave(data, isEdit ? borrower.id : null)
      reset()
      onClose()
    } catch {}
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit Borrower' : 'Add Borrower'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-base">Full Name *</label>
          <input {...register('name')} type="text" placeholder="Ravi Kumar" className="input-base" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">Phone</label>
            <input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="input-base" />
          </div>
          <div>
            <label className="label-base">Email</label>
            <input {...register('email')} type="email" placeholder="email@example.com" className="input-base" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
        </div>
        <div>
          <label className="label-base">Address</label>
          <input {...register('address')} type="text" placeholder="City, State" className="input-base" />
        </div>
        <div>
          <label className="label-base">Notes</label>
          <textarea {...register('notes')} rows={2} placeholder="Any notes about this borrower…" className="input-base resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-brand-500/25">
            {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Add Borrower'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
