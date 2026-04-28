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
    <div className="mobile-page mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-slate-900 px-6 py-7 text-white shadow-2xl shadow-slate-900/40">
        {/* Decorative blobs */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">Portfolio Status</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-3 max-w-[280px] text-xs leading-relaxed text-slate-400">
            You have <span className="font-bold text-white">{summary?.loanCounts?.pending || 0} active loans</span> to track today.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.title} {...kpi} index={i} />
        ))}
      </div>

      {summary?.overdueCount > 0 && (
        <section className="rounded-[28px] border border-rose-200/50 bg-rose-50/50 p-4 shadow-sm dark:border-rose-900/30 dark:bg-rose-900/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
              <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900 dark:text-rose-100">Action Required</h2>
              <p className="mt-0.5 text-xs font-medium text-rose-600/90 dark:text-rose-300/80">
                {summary.overdueCount} loan{summary.overdueCount > 1 ? 's are' : ' is'} overdue.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
        <section className="card p-4 sm:p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Monthly Analytics</h2>
          {monthly.length > 0 ? (
            <MonthlyChart data={monthly} />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">No data yet</div>
          )}
        </section>

        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Alerts</h2>
            <Link to="/notifications" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">View all</Link>
          </div>
          {notifications.length > 0 ? (
            <NotificationTimeline notifications={notifications} onMarkRead={markRead} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-400">
              <Bell size={28} className="text-slate-300" />
              No alerts yet
            </div>
          )}
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
                  className="block rounded-[24px] border border-slate-100 p-4 transition-all active:scale-[0.98] active:bg-slate-50 dark:border-slate-700/50 dark:active:bg-slate-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-slate-900 dark:text-white leading-tight">{loan.borrower?.name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={loan.status} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due {formatDate(loan.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(loan.totalAmount)}</p>
                      <p className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{formatCurrency(loan.paidAmount)} paid</p>
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
