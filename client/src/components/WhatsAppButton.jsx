import { buildWhatsAppUrl, formatCurrency, formatDate } from '../utils/formatters'

export const WhatsAppIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.16 1.6 5.98L0 24l6.24-1.64a11.95 11.95 0 0 0 5.8 1.48h.01c6.58 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.19-3.48-8.42Zm-8.48 18.32h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.7.97.99-3.6-.23-.37a9.88 9.88 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 6.99 2.9 9.84 9.84 0 0 1 2.9 7c0 5.45-4.44 9.89-9.9 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
  </svg>
)

export default function WhatsAppButton({ borrower, loan, className = '' }) {
  if (!borrower?.phone) return null

  const remaining = loan ? (loan.collectableAmount ?? (loan.totalAmount - loan.paidAmount)) : 0
  const message = loan
    ? `Hi ${borrower.name},

This is a reminder from Credit Mint.

💰 Outstanding Amount: ${formatCurrency(remaining)}
📅 Due Date: ${formatDate(loan.dueDate)}

Please arrange for payment at your earliest convenience.

Thank you!`
    : `Hi ${borrower.name}, this is a payment reminder from Credit Mint.`

  const url = buildWhatsAppUrl(borrower.phone, message)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Send WhatsApp reminder to ${borrower.name}`}
      className={`inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-2xl bg-green-500 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition-all hover:bg-green-600 active:scale-95 sm:px-4 ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      <span className="truncate">WhatsApp</span>
    </a>
  )
}
