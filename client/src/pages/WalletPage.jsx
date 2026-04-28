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
    className="relative overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${color}-50 dark:bg-${color}-900/20`}>
        <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
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
      <div className="mobile-page grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-[24px] skeleton" />
        ))}
        <div className="lg:col-span-4 h-96 rounded-[24px] skeleton" />
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
    <div className="mobile-page mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wallet & Capital</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your lending capital and profits.</p>
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

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900/30">
              <tr>
                <th className="px-4 py-4">Transaction Details</th>
                <th className="px-4 py-4">Source</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Amount</th>
                <th className="px-4 py-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        {t.loan ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock size={12} className="text-slate-400" />
                            <span>{t.loan.borrower.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                        <p className="mt-0.5 text-[10px] text-slate-400 italic truncate max-w-[150px]">{t.notes}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-medium uppercase tracking-tighter">Completed</span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-right font-bold ${
                      t.type === 'CREDIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(t.balanceAfter)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <Search className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">No transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
