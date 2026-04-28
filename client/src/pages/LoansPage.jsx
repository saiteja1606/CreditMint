import { useState } from 'react'
import { useLoans } from '../hooks/useLoans'
import { useBorrowers } from '../hooks/useBorrowers'
import LoanTable from '../components/LoanTable'
import LoanModal from '../components/LoanModal'
import PaymentModal from '../components/PaymentModal'
import InterestCollectionModal from '../components/InterestCollectionModal'
import EmptyState from '../components/EmptyState'
import { Plus, Search, CreditCard } from 'lucide-react'

const STATUS_FILTERS = ['ALL', 'PENDING', 'OVERDUE', 'PAID']

export default function LoansPage() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [editLoan, setEditLoan] = useState(null)
  const [payLoan, setPayLoan] = useState(null)
  const [interestLoan, setInterestLoan] = useState(null)

  const params = {}
  if (statusFilter !== 'ALL') params.status = statusFilter
  if (search) params.search = search

  const { loans, loading, createLoan, updateLoan, deleteLoan, payLoan: recordPay, collectInterest } = useLoans(params)
  const { borrowers } = useBorrowers()

  const handleSave = async (data, id) => {
    if (id) {
      await updateLoan(id, data)
    } else {
      await createLoan(data)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this loan? This action cannot be undone.')) {
      await deleteLoan(id)
    }
  }

  const openEdit = (loan) => { setEditLoan(loan); setLoanModalOpen(true) }
  const openNew = () => { setEditLoan(null); setLoanModalOpen(true) }

  return (
    <div className="mobile-page mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loans</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {loans.length} loan{loans.length !== 1 ? 's' : ''} {statusFilter !== 'ALL' ? `· ${statusFilter.toLowerCase()}` : ''}
          </p>
        </div>
        <button onClick={openNew} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-medium text-white shadow-lg shadow-brand-500/25 transition-opacity hover:opacity-90 sm:w-auto">
          <Plus size={16} />
          New Loan
        </button>
      </div>

      <div className="card border-none bg-white/50 p-3 backdrop-blur-md dark:bg-slate-800/50 sm:p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by borrower name..."
              className="input-base pl-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`h-11 whitespace-nowrap rounded-2xl px-5 text-xs font-bold tracking-wide transition-all duration-300 ${
                  statusFilter === status
                    ? 'gradient-brand text-white shadow-lg shadow-brand-500/25'
                    : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All Loans' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-visible">
        {loading ? (
          <div className="space-y-3 p-4 sm:p-6">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton md:h-12" />)}
          </div>
        ) : loans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search || statusFilter !== 'ALL' ? 'No loans match your filters' : 'No loans yet'}
            description="Create your first loan to start tracking."
            action={<button onClick={openNew} className="rounded-2xl gradient-brand px-4 py-2.5 text-sm font-medium text-white">New Loan</button>}
          />
        ) : (
          <LoanTable
            loans={loans}
            onPay={setPayLoan}
            onCollectInterest={setInterestLoan}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <LoanModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        loan={editLoan}
        borrowers={borrowers}
        onSave={handleSave}
      />

      <PaymentModal
        isOpen={!!payLoan}
        onClose={() => setPayLoan(null)}
        loan={payLoan}
        onPay={recordPay}
      />

      <InterestCollectionModal
        isOpen={!!interestLoan}
        onClose={() => setInterestLoan(null)}
        loan={interestLoan}
        onCollect={collectInterest}
      />
    </div>
  )
}
