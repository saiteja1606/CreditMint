/**
 * Format a number as Indian currency (₹)
 */
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined) return '₹0'
  const num = parseFloat(amount)
  if (compact && num >= 100000) {
    const lakhs = num / 100000
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num)
}

/**
 * Format a date to readable string
 */
export const formatDate = (date, opts = {}) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...opts,
  })
}

/**
 * Format date for input[type=date]
 */
export const toInputDate = (date) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

/**
 * Days until / since due date
 */
export const dueDaysLabel = (dueDate) => {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0)
  const diff = Math.round((due - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff > 0) return `Due in ${diff} days`
  return `${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''} overdue`
}

/**
 * Relative time label
 */
export const timeAgo = (date) => {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now - d) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

/**
 * Get initials from a name
 */
export const getInitials = (name = '') => {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

/**
 * Build WhatsApp prefilled message URL
 */
export const buildWhatsAppUrl = (phone, message) => {
  const cleaned = phone?.replace(/\D/g, '') || ''
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

/**
 * Format month key (YYYY-MM) to label (Jan 24)
 */
export const formatMonthKey = (key) => {
  if (!key) return ''
  const [year, month] = key.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}
