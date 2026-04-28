import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { getInitials } from '../utils/formatters'
import api from '../services/api'
import {
  LayoutDashboard, Users, CreditCard, Bell, BarChart3,
  Settings, LogOut, Sun, Moon, Menu, X, ChevronRight, Coins
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/borrowers', icon: Users, label: 'Borrowers' },
  { to: '/loans', icon: CreditCard, label: 'Loans' },
  { to: '/wallet', icon: Coins, label: 'Wallet' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const mobileNavItems = navItems.filter((item) => item.label !== 'Settings' && item.label !== 'Notifications')

const pageTitleMap = {
  '/dashboard': 'Dashboard',
  '/borrowers': 'Borrowers',
  '/loans': 'Loans',
  '/wallet': 'Wallet',
  '/notifications': 'Notifications',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications')
        setUnreadCount(res.data.data.unreadCount || 0)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const pageTitle = location.pathname.startsWith('/borrowers/')
    ? 'Borrower Details'
    : location.pathname.startsWith('/loans/')
      ? 'Loan Details'
      : pageTitleMap[location.pathname] || 'Credit Mint'

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-glow flex-shrink-0 animate-float">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-white text-base leading-none tracking-tight">Credit Mint</h2>
          <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-1">Smart Lending</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group relative
              ${isActive
                ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-desktop"
                    className="absolute inset-0 rounded-2xl border-2 border-brand-500/10 dark:border-brand-400/10"
                  />
                )}
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'}`}>
                  <Icon size={18} />
                </div>
                <span className="flex-1">{label}</span>
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold px-1 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Footer */}
      <div className="px-3 pb-4 space-y-2 border-t border-slate-200 dark:border-slate-700/60 pt-3">
        <NavLink 
          to="/profile" 
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </NavLink>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="sidebar-aside"
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[82vw] max-w-72 bg-white dark:bg-slate-800 z-50 lg:hidden border-r border-slate-200 dark:border-slate-700/60"
            >
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/70 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-11 min-w-11">
            <Menu size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Credit Mint</p>
            <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">{pageTitle}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-11 min-w-11">
              {isDark ? <Sun size={18} className="text-slate-500" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            <NavLink to="/notifications" className="relative p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-11 min-w-11">
              <Bell size={18} className="text-slate-500" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-full pb-24 lg:pb-0"
          >
            <Outlet />
          </motion.div>
        </main>

        <nav className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          <div className="grid grid-cols-5 gap-1 px-2 pt-2">
            {mobileNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all min-h-[60px] ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative flex h-8 w-8 items-center justify-center rounded-2xl transition-all ${isActive ? 'gradient-brand text-white shadow-lg shadow-brand-500/25' : 'bg-slate-100 dark:bg-slate-700/60'}`}>
                      <Icon size={16} />
                      {label === 'Notifications' && unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
