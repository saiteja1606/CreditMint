import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { formatCurrency, formatDate, dueDaysLabel } from '../utils/formatters'
import StatusBadge from '../components/StatusBadge'
import PaymentModal from '../components/PaymentModal'
import InterestCollectionModal from '../components/InterestCollectionModal'
import WhatsAppButton from '../components/WhatsAppButton'
import { ArrowLeft, Calendar, Percent, DollarSign, CheckCircle2 } from 'lucide-react'

export default function LoanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payOpen, setPayOpen] = useState(false)
  const [interestOpen, setInterestOpen] = useState(false)

  const fetchLoan = async () => {
    try {
      const res = await api.get(`/loans/${id}`)
      setLoan(res.data.data.loan)
    } catch { navigate('/loans') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLoan() }, [id])

  const handlePay = async (loanId, data) => {
    await api.post(`/loans/${loanId}/pay`, data)
    await fetchLoan()
  }

  const handleCollectInterest = async (loanId, data) => {
    await api.post(`/loans/${loanId}/collect-interest`, data)
    await fetchLoan()
  }

  if (loading) {
    return (
      <div className="mobile-page mx-auto max-w-3xl space-y-4">
        <div className="h-40 rounded-2xl skeleton" />
        <div className="h-48 rounded-2xl skeleton" />
      </div>
    )
  }
  if (!loan) return null

  const remaining = loan.collectableAmount ?? (loan.totalAmount - loan.paidAmount)
  const pct = loan.totalAmount > 0 ? Math.min(100, (loan.paidAmount / loan.totalAmount) * 100) : 0

  const details = [
    { label: 'Principal', value: formatCurrency(loan.amount), icon: DollarSign },
    { label: 'Interest Rate', value: `${loan.interestRate}% ${loan.interestType === 'MONTHLY' ? '/month' : 'flat'}`, icon: Percent },
    { label: 'Total Interest', value: formatCurrency(loan.totalInterest), icon: Percent },
    { label: 'Late Interest', value: formatCurrency(loan.overdueInterest || 0), icon: Percent },
    { label: 'Total Amount', value: formatCurrency(loan.totalAmount), icon: DollarSign },
    { label: 'Amount Paid', value: formatCurrency(loan.paidAmount), icon: CheckCircle2 },
    { label: 'Need to Collect', value: formatCurrency(remaining), icon: DollarSign },
    { label: 'Start Date', value: formatDate(loan.startDate), icon: Calendar },
    { label: 'Due Date', value: formatDate(loan.dueDate), icon: Calendar },
    { label: 'Borrower Phone', value: loan.borrower?.phone || '-', icon: Calendar },
  ]

  return (
    <div className="mobile-page mx-auto max-w-3xl space-y-5">
      <Link to="/loans" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft size={16} /> Back to Loans
      </Link>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 dark:border-slate-700/70 dark:from-slate-800 dark:to-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Loan - {loan.borrower?.name}</h1>
                <StatusBadge status={loan.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dueDaysLabel(loan.dueDate)}</p>
              {loan.overdueInterest > 0 && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  Late interest running: {formatCurrency(loan.overdueInterest)} for {loan.overdueDays} day{loan.overdueDays > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="hidden flex-wrap gap-2 sm:flex">
              {loan.status !== 'PAID' && (
                <button onClick={() => setPayOpen(true)} className="rounded-2xl gradient-brand px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-500/25">
                  Record Payment
                </button>
              )}
              {loan.status !== 'PAID' && loan.interestType === 'MONTHLY' && (
                <button onClick={() => setInterestOpen(true)} className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20">
                  Collect Interest
                </button>
              )}
              <WhatsAppButton borrower={loan.borrower} loan={loan} />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{Math.round(pct)}% paid</span>
              <span>{formatCurrency(remaining)} need to collect</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full gradient-brand"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.label} className="rounded-[22px] bg-slate-50 p-3.5 dark:bg-slate-700/40">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{detail.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{detail.value}</p>
            </div>
          ))}
        </div>

        {loan.notes && <p className="px-4 pb-5 text-sm italic text-slate-500 dark:text-slate-400 sm:px-6">Note: "{loan.notes}"</p>}
      </motion.section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Payment History ({loan.payments?.length || 0})</h2>
        {loan.payments?.length > 0 ? (
          <div className="space-y-2.5">
            {loan.payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3 rounded-[20px] border border-slate-100 p-3 dark:border-slate-700/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                  {payment.note && <p className="truncate text-xs text-slate-400">{payment.note}</p>}
                </div>
                <p className="text-xs text-slate-400">{formatDate(payment.paidAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">No payments recorded yet</p>
        )}
      </section>

      <div className="mobile-sticky-actions flex gap-3 sm:hidden">
        {loan.status !== 'PAID' && (
          <button onClick={() => setPayOpen(true)} className="flex-1 rounded-2xl gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25">
            Pay
          </button>
        )}
        <WhatsAppButton borrower={loan.borrower} loan={loan} className="flex-1" />
        {loan.status !== 'PAID' && (
          <button onClick={() => setPayOpen(true)} className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20">
            Mark Paid
          </button>
        )}
      </div>

      <PaymentModal isOpen={payOpen} onClose={() => setPayOpen(false)} loan={loan} onPay={handlePay} />
      <InterestCollectionModal isOpen={interestOpen} onClose={() => setInterestOpen(false)} loan={loan} onCollect={handleCollectInterest} />
    </div>
  )
}
