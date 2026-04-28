import { useState, useEffect } from 'react'
import api from '../services/api'
import NotificationTimeline from '../components/NotificationTimeline'
import EmptyState from '../components/EmptyState'
import { Bell, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.data.notifications)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((items) => items.map((item) => (item.id === id ? { ...item, isRead: true } : item)))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })))
      toast.success('All marked as read')
    } catch {}
  }

  const filtered = filter === 'ALL'
    ? notifications
    : filter === 'UNREAD'
      ? notifications.filter((notification) => !notification.isRead)
      : notifications.filter((notification) => notification.isRead)

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <div className="mobile-page mx-auto max-w-2xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 dark:border-slate-700 dark:text-brand-400 dark:hover:bg-brand-900/20">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="card p-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
          {['ALL', 'UNREAD', 'READ'].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`min-h-[44px] whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all ${
                filter === value
                  ? 'gradient-brand text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={filter === 'UNREAD' ? 'You are all caught up.' : 'Notifications will appear here.'}
        />
      ) : (
        <NotificationTimeline notifications={filtered} onMarkRead={markRead} />
      )}
    </div>
  )
}
