import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { formatMonthKey, formatCurrency } from '../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-xl dark:border-slate-600 dark:bg-slate-800">
      <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">{formatMonthKey(label)}</p>
      {payload.map((point) => (
        <div key={point.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: point.color }} />
          <span className="text-slate-500 dark:text-slate-400">{point.name}:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{formatCurrency(point.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyChart({ data }) {
  const formatted = data.map((item) => ({ ...item, monthLabel: formatMonthKey(item.month) }))
  const compact = formatted.length > 6

  return (
    <div className="h-[240px] w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" stroke="currentColor" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthKey}
            interval={compact ? 'preserveStartEnd' : 0}
            minTickGap={compact ? 24 : 12}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={34}
            tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={32} formatter={(value) => <span style={{ fontSize: 11, color: '#94a3b8' }}>{value}</span>} />
          <Area type="monotone" dataKey="lent" name="Lent" stroke="#10b981" strokeWidth={2} fill="url(#colorLent)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
          <Area type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2} fill="url(#colorCollected)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
