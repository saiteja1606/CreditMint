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
const calculateInterest = (principal, rate, type, startDate, dueDate) => {
  const start = new Date(startDate);
  const end = new Date(dueDate);
  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let totalInterest = 0;

  if (rate <= 0) {
    return { totalInterest: 0, totalAmount: principal };
  }

  if (diffDays < 0) {
    return { totalInterest: 0, totalAmount: principal };
  }

  if (type === 'SIMPLE') {
    // Flat percentage for the whole loan term
    totalInterest = (principal * rate) / 100;
  } else if (type === 'MONTHLY') {
    // Charge by calendar month difference, with same-month loans counting as one month
    const months = Math.max(1, ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth()));
    totalInterest = (principal * rate * months) / 100;
  }

  totalInterest = Math.round(totalInterest * 100) / 100;
  const totalAmount = Math.round((principal + totalInterest) * 100) / 100;

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

module.exports = { calculateInterest, computeLoanStatus };
