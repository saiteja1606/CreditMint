import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { changePasswordSchema } from '../validations/schemas'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import { Sun, Bell, Mail, Shield, Save, Coins } from 'lucide-react'

const Toggle = ({ checked, onClick }) => (
  <button
    onClick={onClick}
    className={`relative h-8 w-16 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-slate-300'}`}
  >
    <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-8' : 'translate-x-0'}`} />
  </button>
)

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: user?.smtpHost || '',
    smtpPort: user?.smtpPort || '',
    smtpUser: user?.smtpUser || '',
    smtpPass: '',
    smtpFrom: user?.smtpFrom || '',
  })
  const [reminderPref, setReminderPref] = useState({
    reminderEnabled: user?.reminderEnabled ?? true,
    reminderDaysBefore: user?.reminderDaysBefore ?? 1,
  })
  const [savingSmtp, setSavingSmtp] = useState(false)
  const [savingReminder, setSavingReminder] = useState(false)
  const [runningReminders, setRunningReminders] = useState(false)
  const [walletPref, setWalletPref] = useState({
    initialBalance: user?.initialBalance || 0,
  })
  const [savingWallet, setSavingWallet] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
  })

  const saveSmtp = async () => {
    setSavingSmtp(true)
    try {
      await api.put('/auth/profile', smtpForm)
      toast.success('SMTP settings saved')
      await refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSavingSmtp(false)
    }
  }

  const saveReminder = async () => {
    setSavingReminder(true)
    try {
      await api.put('/auth/profile', reminderPref)
      toast.success('Reminder preferences saved')
      await refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSavingReminder(false)
    }
  }

  const saveWallet = async () => {
    setSavingWallet(true)
    try {
      await api.put('/auth/profile', walletPref)
      toast.success('Wallet settings saved')
      await refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSavingWallet(false)
    }
  }

  const runRemindersNow = async () => {
    setRunningReminders(true)
    try {
      const res = await api.post('/admin/run-reminders')
      const summary = res.data.data
      toast.success(`Reminders run: ${summary.sent} sent, ${summary.failed} failed, ${summary.loansChecked} checked`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run reminders')
    } finally {
      setRunningReminders(false)
    }
  }

  const changePassword = async (data) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed successfully')
      reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="mobile-page mx-auto max-w-2xl space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage preferences, reminders, and account security.</p>
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Sun size={16} /> Appearance</h2>
        <div className="flex items-center justify-between gap-4 rounded-[22px] bg-slate-50 p-4 dark:bg-slate-700/40">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</p>
            <p className="text-xs text-slate-400">Currently: {isDark ? 'Dark' : 'Light'} mode</p>
          </div>
          <Toggle checked={isDark} onClick={toggleTheme} />
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Coins size={16} /> Wallet Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="label-base">Initial Capital Amount (₹)</label>
            <input 
              type="number" 
              value={walletPref.initialBalance} 
              onChange={(e) => setWalletPref({ initialBalance: e.target.value })} 
              className="input-base" 
              placeholder="20000"
            />
            <p className="text-[10px] text-slate-400 mt-1">Changing this will adjust your total capital value.</p>
          </div>
          <button onClick={saveWallet} disabled={savingWallet} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto">
            <Save size={14} /> {savingWallet ? 'Saving...' : 'Update Capital'}
          </button>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Bell size={16} /> Reminder Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-[22px] bg-slate-50 p-4 dark:bg-slate-700/40">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Reminders</p>
              <p className="text-xs leading-5 text-slate-400">Auto-create in-app notifications for due and overdue loans.</p>
            </div>
            <Toggle checked={reminderPref.reminderEnabled} onClick={() => setReminderPref((p) => ({ ...p, reminderEnabled: !p.reminderEnabled }))} />
          </div>

          <div>
            <label className="label-base">Remind before (days)</label>
            <select
              value={reminderPref.reminderDaysBefore}
              onChange={(e) => setReminderPref((p) => ({ ...p, reminderDaysBefore: parseInt(e.target.value, 10) }))}
              className="input-base"
            >
              {[1, 2, 3, 5, 7].map((day) => (
                <option key={day} value={day}>{day} day{day > 1 ? 's' : ''} before</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={saveReminder} disabled={savingReminder} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              <Save size={14} /> {savingReminder ? 'Saving...' : 'Save Preferences'}
            </button>
            <button onClick={runRemindersNow} disabled={runningReminders} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50">
              <Bell size={14} /> {runningReminders ? 'Running...' : 'Run Reminders Now'}
            </button>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Mail size={16} /> Email / SMTP Settings</h2>
        <p className="mb-4 text-xs leading-5 text-slate-400">Leave blank to disable email reminders. In-app notifications always work.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-base">SMTP Host</label>
            <input type="text" value={smtpForm.smtpHost} onChange={(e) => setSmtpForm((f) => ({ ...f, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" className="input-base" />
          </div>
          <div>
            <label className="label-base">SMTP Port</label>
            <input type="number" value={smtpForm.smtpPort} onChange={(e) => setSmtpForm((f) => ({ ...f, smtpPort: e.target.value }))} placeholder="587" className="input-base" />
          </div>
          <div>
            <label className="label-base">SMTP User</label>
            <input type="text" value={smtpForm.smtpUser} onChange={(e) => setSmtpForm((f) => ({ ...f, smtpUser: e.target.value }))} placeholder="you@gmail.com" className="input-base" />
          </div>
          <div>
            <label className="label-base">SMTP Password</label>
            <input type="password" value={smtpForm.smtpPass} onChange={(e) => setSmtpForm((f) => ({ ...f, smtpPass: e.target.value }))} placeholder="App password" className="input-base" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">From Address</label>
            <input type="email" value={smtpForm.smtpFrom} onChange={(e) => setSmtpForm((f) => ({ ...f, smtpFrom: e.target.value }))} placeholder="Credit Mint <noreply@yourdomain.com>" className="input-base" />
          </div>
        </div>
        <button onClick={saveSmtp} disabled={savingSmtp} className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto">
          <Save size={14} /> {savingSmtp ? 'Saving...' : 'Save SMTP Settings'}
        </button>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Shield size={16} /> Security</h2>
        <form onSubmit={handleSubmit(changePassword)} className="space-y-3">
          <div>
            <label className="label-base">Current Password</label>
            <input {...register('currentPassword')} type="password" placeholder="........" className="input-base" />
            {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="label-base">New Password</label>
            <input {...register('newPassword')} type="password" placeholder="Min. 6 characters" className="input-base" />
            {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label-base">Confirm New Password</label>
            <input {...register('confirmPassword')} type="password" placeholder="........" className="input-base" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl gradient-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto">
            <Shield size={14} /> {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  )
}
