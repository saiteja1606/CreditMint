/**
 * Interest Calculation Service for Credit Mint
 *
 * SIMPLE  -> flat percentage applied once to the principal for the full loan
 * MONTHLY -> monthly percentage applied per started month of the loan duration
 */

/**
 * Calculate interest and return { totalInterest, totalAmount }
 * @param {number} principal
 * @param {number} rate - percentage
 * @param {'SIMPLE'|'MONTHLY'} type
 * @param {Date} startDate
 * @param {Date} dueDate
 */
const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const calculateMonthlyInterest = (principal, rate) => {
  const amount = Number(principal);
  const percent = Number(rate);
  if (!Number.isFinite(amount) || !Number.isFinite(percent) || amount < 0 || percent < 0) {
    return 0;
  }
  return round2((amount * percent) / 100);
};

const calculateInterest = (principal, rate, type, startDate, dueDate) => {
  const safePrincipal = Math.max(0, Number(principal) || 0);
  const safeRate = Math.max(0, Number(rate) || 0);
  const start = new Date(startDate);
  const end = new Date(dueDate);
  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let totalInterest = 0;

  if (safeRate <= 0) {
    return { totalInterest: 0, totalAmount: round2(safePrincipal) };
  }

  if (diffDays < 0) {
    return { totalInterest: 0, totalAmount: round2(safePrincipal) };
  }

  if (type === 'SIMPLE') {
    // Flat percentage for the whole loan term
    totalInterest = calculateMonthlyInterest(safePrincipal, safeRate);
  } else if (type === 'MONTHLY') {
    // Charge by calendar month difference, with same-month loans counting as one month
    const months = Math.max(1, ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth()));
    totalInterest = calculateMonthlyInterest(safePrincipal, safeRate) * months;
  }

  totalInterest = round2(totalInterest);
  const totalAmount = round2(safePrincipal + totalInterest);

  return { totalInterest, totalAmount };
};

/**
 * Determine loan status based on paid amount and due date
 */
const computeLoanStatus = (paidAmount, totalAmount, dueDate) => {
  if (paidAmount >= totalAmount) return 'PAID';
  if (new Date(dueDate) < new Date()) return 'OVERDUE';
  return 'PENDING';
};

module.exports = { calculateInterest, calculateMonthlyInterest, computeLoanStatus };
