import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import KPICard from '../components/KPICard'
import MonthlyChart from '../components/MonthlyChart'
import NotificationTimeline from '../components/NotificationTimeline'
import { formatCurrency, formatDate } from '../utils/formatters'
import StatusBadge from '../components/StatusBadge'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, Clock, AlertTriangle, CalendarClock, CalendarCheck, BarChart3, Bell, ArrowUpRight } from 'lucide-react'

const Skeleton = () => (
  <div className="mobile-page">
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card h-28 rounded-2xl p-5 skeleton" />
      ))}
    </div>
  </div>
)

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [recentLoans, setRecentLoans] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sumRes, monRes, loanRes, notifRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/monthly'),
          api.get('/loans'),
          api.get('/notifications'),
        ])
        setSummary(sumRes.data.data)
        setMonthly(monRes.data.data.monthly)
        setRecentLoans(loanRes.data.data.loans.slice(0, 5))
        setNotifications(notifRes.data.data.notifications.slice(0, 4))
      } catch {}
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((items) => items.map((item) => (item.id === id ? { ...item, isRead: true } : item)))
    } catch {}
  }

  if (loading) return <Skeleton />

  const kpis = summary ? [
    { title: 'Available Balance', value: summary.wallet.balance, icon: Wallet, color: 'brand' },
    { title: 'Total Lent Out', value: summary.wallet.lent, icon: ArrowUpRight, color: 'blue' },
    { title: 'Total Profit', value: summary.wallet.profit, icon: TrendingUp, color: 'emerald' },
    { title: 'Total Capital Value', value: summary.wallet.totalValue, icon: BarChart3, color: 'violet' },
    { title: 'Active Loans', value: summary.loanCounts.pending + summary.loanCounts.overdue, isCurrency: false, icon: Clock, color: 'amber' },
    { title: 'Overdue Loans', value: summary.overdueCount, isCurrency: false, icon: AlertTriangle, color: 'red' },
    { title: 'Due Today', value: summary.dueTodayCount, isCurrency: false, icon: CalendarCheck, color: 'amber' },
    { title: 'Upcoming (7d)', value: summary.upcomingCount, isCurrency: false, icon: CalendarClock, color: 'teal' },
  ] : []

  return (
    <div className="mobile-page mx-auto max-w-7xl space-y-5 sm:space-y-6">
      <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 p-5 text-white shadow-xl shadow-slate-900/20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">Overview</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-white/70">Track portfolio health, cash flow, and upcoming follow-ups in one mobile-friendly dashboard.</p>
      </section>

      <section className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KPICard key={kpi.title} {...kpi} index={i} />
          ))}
        </div>
      </section>

      {summary?.overdueCount > 0 && (
        <section className="rounded-[24px] border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/40 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">Overdue attention needed</h2>
              <p className="mt-1 text-sm leading-6 text-red-600/90 dark:text-red-200/80">
                {summary.overdueCount} overdue loan{summary.overdueCount > 1 ? 's are' : ' is'} affecting {formatCurrency(summary.pendingAmount)} in pending recovery.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <section className="card flex flex-col p-4 sm:p-5 lg:col-span-2 lg:h-[420px]">
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Monthly Analytics</h2>
          <div className="flex-1 min-h-0">
            {monthly.length > 0 ? (
              <MonthlyChart data={monthly} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No data yet</div>
            )}
          </div>
        </section>

        <section className="card flex flex-col p-4 sm:p-5 lg:h-[420px]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Alerts</h2>
            <Link to="/notifications" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">View all</Link>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {notifications.length > 0 ? (
              <NotificationTimeline notifications={notifications} onMarkRead={markRead} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm text-slate-400">
                <Bell size={28} className="text-slate-300" />
                No alerts yet
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Loans</h2>
          <Link to="/loans" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">View all</Link>
        </div>
        <div className="space-y-3">
          {recentLoans.length > 0 ? (
            recentLoans.map((loan) => (
              loan?.id ? (
                <Link
                  key={loan.id}
                  to={`/loans/${loan.id}`}
                  className="block rounded-[22px] border border-slate-100 p-3.5 transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-md dark:border-slate-700/50 dark:hover:border-brand-700/50 dark:hover:bg-brand-900/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{loan.borrower?.name}</p>
                        <StatusBadge status={loan.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Due {formatDate(loan.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(loan.totalAmount)}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(loan.paidAmount)} paid</p>
                    </div>
                  </div>
                </Link>
              ) : null
            ))
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No loans created yet</p>
          )}
        </div>
      </section>
    </div>
  )
}
