import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { formatCurrency, formatDate, getInitials } from '../utils/formatters'
import LoanTable from '../components/LoanTable'
import PaymentModal from '../components/PaymentModal'
import InterestCollectionModal from '../components/InterestCollectionModal'
import WhatsAppButton from '../components/WhatsAppButton'
import { ArrowLeft, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react'

export default function BorrowerProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payLoan, setPayLoan] = useState(null)
  const [interestLoan, setInterestLoan] = useState(null)

  const fetchBorrower = async () => {
    try {
      const res = await api.get(`/borrowers/${id}`)
      setData(res.data.data.borrower)
    } catch { navigate('/borrowers') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBorrower() }, [id])

  const handlePay = async (loanId, payData) => {
    await api.post(`/loans/${loanId}/pay`, payData)
    await fetchBorrower()
  }

  const handleCollectInterest = async (loanId, payload) => {
    await api.post(`/loans/${loanId}/collect-interest`, payload)
    await fetchBorrower()
  }

  if (loading) {
    return (
      <div className="mobile-page mx-auto max-w-4xl space-y-4">
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-64 rounded-2xl skeleton" />
      </div>
    )
  }
  if (!data) return null

  const statCards = [
    { label: 'Total Borrowed', value: formatCurrency(data.totalBorrowed), icon: 'Rs' },
    { label: 'Outstanding', value: formatCurrency(data.outstanding), icon: 'Due' },
    { label: 'Active Loans', value: data.activeLoans, icon: 'Live' },
    { label: 'Paid Loans', value: data.paidLoans, icon: 'Done' },
  ]

  const paymentHistory = data.loans?.flatMap((loan) => loan.payments.map((payment) => ({ ...payment, loanId: loan.id })))
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)) || []

  return (
    <div className="mobile-page mx-auto max-w-4xl space-y-5">
      <Link to="/borrowers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft size={16} /> Back to Borrowers
      </Link>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 dark:border-slate-700/70 dark:from-slate-800 dark:to-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] gradient-brand text-xl font-bold text-white shadow-lg shadow-brand-500/25">
              {getInitials(data.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{data.name}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                {data.phone && <span className="flex items-center gap-1"><Phone size={13} />{data.phone}</span>}
                {data.email && <span className="flex items-center gap-1"><Mail size={13} />{data.email}</span>}
                {data.address && <span className="flex items-center gap-1"><MapPin size={13} />{data.address}</span>}
              </div>
              {data.notes && <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">"{data.notes}"</p>}
            </div>
            <div className="hidden sm:block">
              <WhatsAppButton borrower={data} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-5">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-[22px] bg-slate-50 p-3 text-center dark:bg-slate-700/40">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.icon}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Loans ({data.loans?.length || 0})</h2>
        {data.loans?.length > 0 ? (
          <LoanTable
            loans={data.loans}
            showBorrower={false}
            onPay={setPayLoan}
            onCollectInterest={setInterestLoan}
          />
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No loans yet</p>
        )}
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Payment History</h2>
        {paymentHistory.length > 0 ? (
          <div className="space-y-2.5">
            {paymentHistory.map((payment) => (
              <div key={payment.id} className="flex items-center gap-3 rounded-[20px] border border-slate-100 p-3 dark:border-slate-700/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                  {payment.note && <p className="truncate text-xs text-slate-400">{payment.note}</p>}
                </div>
                <p className="text-xs text-slate-400">{formatDate(payment.paidAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No payments recorded</p>
        )}
      </section>

      {data.reminderLogs?.length > 0 && (
        <section className="card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Reminder History</h2>
          <div className="space-y-2.5">
            {data.reminderLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-[20px] border border-slate-100 p-3 dark:border-slate-700/50">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${log.status === 'SENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : log.status === 'FAILED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {log.type} · {log.status}
                </span>
                <span className="ml-auto text-xs text-slate-400">{formatDate(log.sentAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mobile-sticky-actions flex gap-3 sm:hidden">
        <WhatsAppButton borrower={data} className="flex-1" />
        {data.loans?.some((loan) => loan.status !== 'PAID') && (
          <button
            onClick={() => {
              const firstPendingLoan = data.loans.find((loan) => loan.status !== 'PAID')
              if (firstPendingLoan) setPayLoan(firstPendingLoan)
            }}
            className="flex-1 rounded-2xl gradient-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25"
          >
            Pay
          </button>
        )}
      </div>

      <PaymentModal isOpen={!!payLoan} onClose={() => setPayLoan(null)} loan={payLoan} onPay={handlePay} />
      <InterestCollectionModal isOpen={!!interestLoan} onClose={() => setInterestLoan(null)} loan={interestLoan} onCollect={handleCollectInterest} />
    </div>
  )
}
