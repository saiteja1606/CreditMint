import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { registerSchema } from '../validations/schemas'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Phone, Eye, EyeOff, IndianRupee } from 'lucide-react'
import { useState } from 'react'

export default function RegisterPage() {
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    try {
      await authRegister(data)
      toast.success('Account created! Welcome to Credit Mint 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="card p-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create account</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Start managing your loans with Credit Mint</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-base">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('name')} type="text" className="input-base pl-9" placeholder="Arjun Sharma" />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label-base">Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('email')} type="email" className="input-base pl-9" placeholder="you@email.com" />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-base">Phone (optional)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('phone')} type="tel" className="input-base pl-9" placeholder="+91 98765 43210" />
          </div>
        </div>

        <div>
          <label className="label-base">Initial Capital (₹) *</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('initialBalance')} type="number" className="input-base pl-9" placeholder="20000" />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">This is your starting wallet balance.</p>
          {errors.initialBalance && <p className="text-xs text-red-500 mt-1">{errors.initialBalance.message}</p>}
        </div>

        <div>
          <label className="label-base">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input {...register('password')} type={showPw ? 'text' : 'password'} className="input-base pl-9 pr-9" placeholder="Min. 6 characters" />
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
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
