import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loginSchema } from '../validations/schemas'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@creditmint.app', password: 'password123' },
  })

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back! 👋')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sign in to your Credit Mint account</p>

      {/* Demo hint */}
      <div className="mb-5 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 text-xs text-brand-700 dark:text-brand-400">
        🎯 <strong>Demo credentials pre-filled.</strong> Just click Sign In!
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-base">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('email')} type="email" className="input-base pl-9" placeholder="you@email.com" />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-base">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('password')} type={showPw ? 'text' : 'password'} className="input-base pl-9 pr-9" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-brand-500/30"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Create one</Link>
      </p>
    </div>
  )
}
