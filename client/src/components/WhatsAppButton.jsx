import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl, formatCurrency, formatDate } from '../utils/formatters'

export default function WhatsAppButton({ borrower, loan, className = '' }) {
  if (!borrower?.phone) return null

  const remaining = loan ? (loan.collectableAmount ?? (loan.totalAmount - loan.paidAmount)) : 0
  const message = loan
    ? `Hi ${borrower.name},\n\nThis is a reminder from *Credit Mint*.\n\n💰 Outstanding Amount: *${formatCurrency(remaining)}*\n📅 Due Date: *${formatDate(loan.dueDate)}*\n\nPlease arrange for payment at your earliest convenience.\n\nThank you!`
    : `Hi ${borrower.name}, this is a payment reminder from Credit Mint.`

  const url = buildWhatsAppUrl(borrower.phone, message)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-500/25 transition-colors hover:bg-green-600 ${className}`}
    >
      <MessageCircle size={16} />
      WhatsApp
    </a>
  )
}
