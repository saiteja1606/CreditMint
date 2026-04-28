const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Recomputes and returns the wallet summary for a user based on DB truth.
 * This avoids relying on potentially stale fields in the User model.
 */
const getWalletSummary = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      initialBalance: true,
      walletBalance: true, // We still use this as the "Cash in Hand"
    }
  });

  // Calculate current active Lent Out amount from "PENDING" and "OVERDUE" loans
  const loans = await prisma.loan.findMany({
    where: { 
      userId, 
      status: { in: ['PENDING', 'OVERDUE'] } 
    },
    select: {
      amount: true,
      paidAmount: true
    }
  });

  // Lent Out = Total Principal of active loans - Principal already recovered in those active loans
  // Actually, simpler: Lent Out = sum(principal - principal_paid) for active loans
  // Wait, if a loan is 10k and 2k is paid (principal part), 8k is still lent out.
  // Our system recovers principal first in recordPayment.
  
  const lentOutAmount = loans.reduce((sum, loan) => {
    const remainingPrincipal = Math.max(0, loan.amount - loan.paidAmount);
    return sum + remainingPrincipal;
  }, 0);

  // Profit calculation from all transactions or loans
  // For now, we can trust the totalProfit field IF it's updated correctly, 
  // but the requirement says "recompute from DB truth".
  // Profit = sum(all payments) - sum(all lent principal recovered)
  const allLoans = await prisma.loan.findMany({
    where: { userId },
    include: { payments: true }
  });

  let totalProfit = 0;
  allLoans.forEach(loan => {
    const totalPayments = loan.payments.reduce((s, p) => s + p.amount, 0);
    const principalRecovered = Math.min(loan.amount, loan.paidAmount);
    const profitFromLoan = Math.max(0, totalPayments - principalRecovered);
    totalProfit += profitFromLoan;
  });

  const activeLoansCount = loans.length;

  return {
    initialBalance: user.initialBalance,
    walletBalance: user.walletBalance,
    totalProfit: Math.round(totalProfit * 100) / 100,
    lentOutAmount: Math.round(lentOutAmount * 100) / 100,
    activeLoansCount,
    totalCapitalValue: Math.round((user.walletBalance + lentOutAmount) * 100) / 100
  };
};

/**
 * Updates the User model's wallet-related fields to stay in sync with recomputed truth.
 */
const syncUserWalletFields = async (userId) => {
  const summary = await getWalletSummary(userId);
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      lentOutAmount: summary.lentOutAmount,
      totalProfit: summary.totalProfit
      // walletBalance is updated manually by transactions (creation/payment), 
      // so we don't overwrite it here unless we also recompute it from transactions.
    }
  });
  
  return summary;
};

module.exports = {
  getWalletSummary,
  syncUserWalletFields
};
