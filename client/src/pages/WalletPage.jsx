import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  TrendingUp, 
  PieChart,
  ArrowRight,
  Plus,
  Filter,
  Search,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import EmptyState from '../components/EmptyState'

const StatCard = ({ title, value, icon: Icon, color, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-3.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</h3>
        {trend && (
          <div className={`mt-1.5 flex items-center gap-1 text-[9px] font-bold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.positive ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${color}-50 dark:bg-${color}-900/20`}>
        <Icon className={`h-4.5 w-4.5 text-${color}-600 dark:text-${color}-400`} />
      </div>
    </div>
  </motion.div>
)

export default function WalletPage() {
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, CREDIT, DEBIT
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sumRes, transRes] = await Promise.all([
        api.get('/wallet/summary'),
        api.get('/wallet/transactions')
      ])
      setSummary(sumRes.data.data.summary)
      setTransactions(transRes.data.data.transactions)
    } catch (error) {
      console.error('Failed to fetch wallet data', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'ALL' || t.type === filter
    const matchesSearch = !search || 
      t.source.toLowerCase().includes(search.toLowerCase()) ||
      t.notes?.toLowerCase().includes(search.toLowerCase()) ||
      t.loan?.borrower?.name?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="mobile-page grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-3xl skeleton" />
        ))}
        <div className="lg:col-span-4 h-96 rounded-3xl skeleton" />
      </div>
    )
  }

  const stats = [
    { 
      title: 'Available Balance', 
      value: formatCurrency(summary?.walletBalance), 
      icon: Wallet, 
      color: 'brand',
      trend: { label: 'Liquid Cash', positive: true },
      delay: 0.1
    },
    { 
      title: 'Lent Out Amount', 
      value: formatCurrency(summary?.lentOutAmount), 
      icon: ArrowUpRight, 
      color: 'blue',
      trend: { label: `${summary?.activeLoansCount || 0} Active Loans`, positive: true },
      delay: 0.2
    },
    { 
      title: 'Total Profit', 
      value: formatCurrency(summary?.totalProfit), 
      icon: TrendingUp, 
      color: 'emerald',
      trend: { label: 'Net Interest Earned', positive: true },
      delay: 0.3
    },
    { 
      title: 'Total Capital', 
      value: formatCurrency(summary?.totalCapitalValue), 
      icon: PieChart, 
      color: 'violet',
      trend: { label: `Started with ${formatCurrency(summary?.initialBalance)}`, positive: true },
      delay: 0.4
    },
  ]

  return (
    <div className="mobile-page mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Wallet & Capital</h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">Track your lending capital and profits.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <History size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="card space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction History</h2>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10 h-10 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
              {['ALL', 'CREDIT', 'DEBIT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === t 
                      ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400' 
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All' : t === 'CREDIT' ? 'Repayments' : 'Lent Out'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="space-y-3 md:hidden">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <div key={t.id} className="rounded-[28px] border border-slate-100 bg-white p-4 dark:border-slate-800/60 shadow-sm dark:bg-slate-900/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] shadow-sm ${
                      t.type === 'CREDIT' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                      {t.type === 'CREDIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {t.source === 'LOAN_CREATION' ? 'Disbursed' : 
                         t.source === 'REPAYMENT' ? 'Repayment' : 
                         t.source === 'INTEREST_COLLECTION' ? 'Interest' : 'Adjustment'}
                      </p>
                      <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(t.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${
                      t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bal: {formatCurrency(t.balanceAfter)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3 dark:border-slate-800/40">
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60 border border-slate-100/50 dark:border-slate-800/60">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{t.loan?.borrower?.name || 'System'}</span>
                  </div>
                  {t.notes && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/60 border border-slate-100/50 dark:border-slate-800/60">
                      <AlertCircle size={12} className="text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic truncate max-w-[140px]">{t.notes}</span>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Success</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <EmptyState icon={Search} title="No transactions found" description="Try adjusting your filters or search terms." />
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto rounded-[24px] border border-slate-100 dark:border-slate-700/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900/30">
              <tr>
                <th className="px-5 py-4">Transaction Details</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        t.type === 'CREDIT' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                      }`}>
                        {t.type === 'CREDIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {t.source === 'LOAN_CREATION' ? 'Capital Disbursed' : 
                           t.source === 'REPAYMENT' ? 'Repayment Received' : 
                           t.source === 'INTEREST_COLLECTION' ? 'Interest Collected' : 'Manual Adjustment'}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(t.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs">
                      {t.loan ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Clock size={12} className="text-slate-400" />
                          <span>{t.loan.borrower.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}
                      {t.notes && <p className="mt-0.5 text-[10px] text-slate-400 italic truncate max-w-[150px]">{t.notes}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
                    </div>
                  </td>
                  <td className={`px-5 py-4 text-right font-bold ${
                    t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-600 dark:text-slate-300">
                    {formatCurrency(t.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
