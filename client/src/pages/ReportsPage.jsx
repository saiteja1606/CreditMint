import { useState, useEffect } from 'react'
import api from '../services/api'
import MonthlyChart from '../components/MonthlyChart'
import { formatCurrency, formatMonthKey } from '../utils/formatters'
import { Download, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const PIE_COLORS = ['#10b981', '#6366f1', '#ef4444']

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [borrowerWise, setBorrowerWise] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, m, b] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/monthly'),
          api.get('/reports/borrower-wise'),
        ])
        setSummary(s.data.data)
        setMonthly(m.data.data.monthly)
        setBorrowerWise(b.data.data.report)
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `creditmint_report_${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {}
  }

  if (loading) {
    return (
      <div className="mobile-page mx-auto max-w-5xl space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl skeleton" />)}
      </div>
    )
  }

  const pieData = summary ? [
    { name: 'Paid', value: summary.totalCollected },
    { name: 'Pending', value: summary.pendingAmount },
    { name: 'Overdue', value: Math.max(0, summary.pendingAmount * 0.3) },
  ] : []

  const summaryCards = summary ? [
    { label: 'Total Lent', value: formatCurrency(summary.totalLent), icon: TrendingUp, color: 'text-brand-500' },
    { label: 'Total Collected', value: formatCurrency(summary.totalCollected), icon: BarChart3, color: 'text-indigo-500' },
    { label: 'Pending Recovery', value: formatCurrency(summary.pendingAmount), icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Interest Earned', value: formatCurrency(summary.interestEarned), icon: TrendingUp, color: 'text-brand-500' },
  ] : []

  return (
    <div className="mobile-page mx-auto max-w-5xl space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Analytics and export</p>
        </div>
        <button onClick={handleExport} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 sm:w-auto">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {summaryCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card min-w-[180px] p-4">
              <card.icon size={18} className={`${card.color} mb-2`} />
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{card.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Monthly Trends</h2>
          <MonthlyChart data={monthly} />
        </div>
        <div className="card flex flex-col p-4 sm:p-5">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Portfolio Split</h2>
          <div className="flex flex-1 items-center justify-center">
            {summary && (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend formatter={(val) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{val}</span>} />
                  <Tooltip formatter={(value) => formatCurrency(value, true)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {monthly.length > 0 && (
        <div className="card p-4 sm:p-5">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Monthly Collections</h2>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="h-[220px] min-w-[560px] sm:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis dataKey="month" tickFormatter={formatMonthKey} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value, true)} labelFormatter={formatMonthKey} />
                  <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lent" name="Lent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="card p-4 sm:p-5">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Borrower-wise Report</h2>
        <div className="space-y-3 md:hidden">
          {borrowerWise.map((borrower) => (
            <div key={borrower.id} className="rounded-[22px] border border-slate-100 p-4 dark:border-slate-700/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{borrower.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{borrower.loanCount} loan{borrower.loanCount > 1 ? 's' : ''}</p>
                </div>
                {borrower.overdueCount > 0 ? <span className="badge-overdue">{borrower.overdueCount}</span> : <span className="text-xs text-slate-400">No overdue</span>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Borrowed</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(borrower.totalBorrowed)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Paid</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(borrower.paidAmount)}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-700/40">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Outstanding</p>
                  <p className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(borrower.outstanding)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Borrower', 'Total Borrowed', 'Paid', 'Outstanding', 'Loans', 'Overdue'].map((heading) => (
                  <th key={heading} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {borrowerWise.map((borrower) => (
                <tr key={borrower.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/20">
                  <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">{borrower.name}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(borrower.totalBorrowed)}</td>
                  <td className="px-3 py-3 text-emerald-600 dark:text-emerald-400">{formatCurrency(borrower.paidAmount)}</td>
                  <td className="px-3 py-3 font-medium text-red-600 dark:text-red-400">{formatCurrency(borrower.outstanding)}</td>
                  <td className="px-3 py-3 text-slate-500">{borrower.loanCount}</td>
                  <td className="px-3 py-3">
                    {borrower.overdueCount > 0 ? <span className="badge-overdue">{borrower.overdueCount}</span> : <span className="text-slate-400">-</span>}
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
