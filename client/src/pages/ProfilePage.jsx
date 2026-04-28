import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import toast from 'react-hot-toast'
import { getInitials, formatDate } from '../utils/formatters'
import { User, Mail, Phone, Calendar, Edit, Save, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/auth/profile', form)
      await refreshUser()
      toast.success('Profile updated!')
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-glow">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <Edit size={14} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="label-base">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" />
            </div>
            <div>
              <label className="label-base">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="input-base" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { icon: User, label: 'Name', value: user?.name },
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
              { icon: Calendar, label: 'Member since', value: formatDate(user?.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <Icon size={16} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
