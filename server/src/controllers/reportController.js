const { PrismaClient } = require('@prisma/client');
const { success } = require('../utils/apiResponse');
const { getLoanSnapshot } = require('../services/loanSnapshotService');
const { getWalletSummary } = require('../services/walletService');

const prisma = new PrismaClient();

// GET /api/reports/summary
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const loans = await prisma.loan.findMany({
      where: { userId },
      select: { amount: true, interestRate: true, interestType: true, totalAmount: true, paidAmount: true, totalInterest: true, status: true, dueDate: true },
    });

    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
    const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);

    const totalLent = loans.reduce((s, l) => s + l.amount, 0);
    const totalCollected = loans.reduce((s, l) => s + l.paidAmount, 0);
    const pendingAmount = loans.filter(l => l.status !== 'PAID').reduce((s, l) => s + getLoanSnapshot(l).collectableAmount, 0);
    const interestEarned = loans.filter(l => l.status === 'PAID').reduce((s, l) => s + l.totalInterest, 0);
    const overdueCount = loans.filter(l => l.status === 'OVERDUE').length;
    const dueTodayCount = loans.filter(l => l.status === 'PENDING' && new Date(l.dueDate) >= startOfToday && new Date(l.dueDate) <= endOfToday).length;
    const upcomingCount = loans.filter(l => l.status === 'PENDING' && new Date(l.dueDate) > endOfToday && new Date(l.dueDate) <= in7Days).length;

    const walletSummary = await getWalletSummary(userId);

    return success(res, {
      totalLent, totalCollected, pendingAmount, interestEarned,
      overdueCount, dueTodayCount, upcomingCount,
      wallet: {
        balance: walletSummary.walletBalance,
        initial: walletSummary.initialBalance,
        profit: walletSummary.totalProfit,
        lent: walletSummary.lentOutAmount,
        totalValue: walletSummary.totalCapitalValue
      },
      loanCounts: {
        total: loans.length,
        pending: loans.filter(l => l.status === 'PENDING').length,
        paid: loans.filter(l => l.status === 'PAID').length,
        overdue: overdueCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/monthly
const getMonthly = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payments = await prisma.payment.findMany({
      where: { loan: { userId } },
      select: { amount: true, paidAt: true, loan: { select: { totalInterest: true, totalAmount: true } } },
      orderBy: { paidAt: 'asc' },
    });

    const loans = await prisma.loan.findMany({
      where: { userId },
      select: { amount: true, startDate: true },
      orderBy: { startDate: 'asc' },
    });

    // Group by month
    const monthMap = {};

    for (const p of payments) {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: key, collected: 0, interest: 0, lent: 0 };
      monthMap[key].collected += p.amount;
    }

    for (const l of loans) {
      const d = new Date(l.startDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: key, collected: 0, interest: 0, lent: 0 };
      monthMap[key].lent += l.amount;
    }

    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    return success(res, { monthly });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/export (CSV)
const exportCSV = async (req, res, next) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: {
        borrower: { select: { name: true, phone: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = [
      ['Borrower', 'Phone', 'Email', 'Principal', 'Interest Rate', 'Interest Type', 'Total Interest', 'Total Amount', 'Paid Amount', 'Remaining', 'Status', 'Start Date', 'Due Date', 'Notes'],
    ];

    for (const loan of loans) {
      rows.push([
        loan.borrower?.name || '',
        loan.borrower?.phone || '',
        loan.borrower?.email || '',
        loan.amount,
        loan.interestRate,
        loan.interestType,
        loan.totalInterest,
        loan.totalAmount,
        loan.paidAmount,
        getLoanSnapshot(loan).collectableAmount.toFixed(2),
        loan.status,
        new Date(loan.startDate).toLocaleDateString('en-IN'),
        new Date(loan.dueDate).toLocaleDateString('en-IN'),
        loan.notes || '',
      ]);
    }

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="creditmint_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/borrower-wise
const getBorrowerWise = async (req, res, next) => {
  try {
    const borrowers = await prisma.borrower.findMany({
      where: { userId: req.user.id },
      include: {
        loans: { select: { amount: true, interestRate: true, interestType: true, totalAmount: true, paidAmount: true, status: true, totalInterest: true, dueDate: true } },
      },
    });

    const report = borrowers.map(b => ({
      id: b.id, name: b.name, phone: b.phone,
      totalBorrowed: b.loans.reduce((s, l) => s + l.amount, 0),
      totalAmount: b.loans.reduce((s, l) => s + l.totalAmount, 0),
      paidAmount: b.loans.reduce((s, l) => s + l.paidAmount, 0),
      outstanding: b.loans.reduce((s, l) => s + getLoanSnapshot(l).collectableAmount, 0),
      interestOwed: b.loans.reduce((s, l) => s + l.totalInterest, 0),
      loanCount: b.loans.length,
      overdueCount: b.loans.filter(l => l.status === 'OVERDUE').length,
    }));

    return success(res, { report });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getMonthly, exportCSV, getBorrowerWise };
