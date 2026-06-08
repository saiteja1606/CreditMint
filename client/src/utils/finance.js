export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100

export const calculateInterest = (principal, rate) => {
  const amount = Number(principal)
  const percent = Number(rate)
  if (!Number.isFinite(amount) || !Number.isFinite(percent) || amount < 0 || percent < 0) {
    return 0
  }
  return roundMoney((amount * percent) / 100)
}

export const calculateLoanPreview = (amount, rate, type, startDate, dueDate) => {
  if (!amount || !startDate || !dueDate) return null

  const principal = Number(amount)
  const sd = new Date(startDate)
  const dd = new Date(dueDate)

  if (!Number.isFinite(principal) || principal < 0 || Number.isNaN(sd.getTime()) || Number.isNaN(dd.getTime()) || dd < sd) {
    return null
  }

  const monthlyInterest = calculateInterest(principal, rate)
  const months = type === 'MONTHLY'
    ? Math.max(1, ((dd.getFullYear() - sd.getFullYear()) * 12) + (dd.getMonth() - sd.getMonth()))
    : 1
  const interest = roundMoney(monthlyInterest * months)
  const total = roundMoney(principal + interest)

  return {
    interest,
    monthlyInterest,
    total,
    profit: interest,
  }
}
