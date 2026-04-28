const { PrismaClient } = require('@prisma/client');
const { success, created, notFound, badRequest } = require('../utils/apiResponse');
const { calculateInterest, computeLoanStatus } = require('../services/interestService');
const { getLoanSnapshot, round2 } = require('../services/loanSnapshotService');
const { sendPaymentReceivedEmail, sendLoanCreatedEmail, sendInterestCollectedEmail } = require('../services/emailService');
const { syncUserWalletFields } = require('../services/walletService');

const prisma = new PrismaClient();

const addOneMonth = (dateValue) => {
  const next = new Date(dateValue);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const sendPaymentEmailIfPossible = async (loan, amount, note) => {
  if (!loan.borrower?.email) return;

  const user = await prisma.user.findUnique({ where: { id: loan.userId } });
  const smtpOverride = {
    host: user?.smtpHost,
    port: user?.smtpPort,
    user: user?.smtpUser,
    pass: user?.smtpPass,
    from: user?.smtpFrom,
  };

  await sendPaymentReceivedEmail({
    to: loan.borrower.email,
    borrowerName: loan.borrower.name,
    lenderName: user?.name || 'Credit Mint',
    amount,
    paidAt: new Date(),
    note,
    smtpOverride,
  });
};

const sendInterestEmailIfPossible = async (loan, amount, nextDueDate, totalAmount) => {
  if (!loan.borrower?.email) return;

  const user = await prisma.user.findUnique({ where: { id: loan.userId } });
  const smtpOverride = {
    host: user?.smtpHost,
    port: user?.smtpPort,
    user: user?.smtpUser,
    pass: user?.smtpPass,
    from: user?.smtpFrom,
  };

  await sendInterestCollectedEmail({
    to: loan.borrower.email,
    borrowerName: loan.borrower.name,
    lenderName: user?.name || 'Credit Mint',
    amount,
    nextDueDate,
    totalAmount,
    smtpOverride,
  });
};

const loanInclude = {
  borrower: { select: { id: true, name: true, phone: true, email: true } },
  payments: { orderBy: { paidAt: 'desc' } },
};

// GET /api/loans
const getLoans = async (req, res, next) => {
  try {
    const { status, borrowerId, search } = req.query;

    const loans = await prisma.loan.findMany({
      where: {
        userId: req.user.id,
        ...(status && { status }),
        ...(borrowerId && { borrowerId }),
        ...(search && { borrower: { name: { contains: search } } }),
      },
      include: loanInclude,
      orderBy: { createdAt: 'desc' },
    });

    const updated = loans.map((loan) => {
      const computed = computeLoanStatus(loan.paidAmount, loan.totalAmount, loan.dueDate);
      if (computed !== loan.status && loan.status !== 'PAID') {
        prisma.loan.update({ where: { id: loan.id }, data: { status: computed } }).catch(() => {});
      }
      return getLoanSnapshot({ ...loan, status: computed });
    });

    return success(res, { loans: updated });
  } catch (err) {
    next(err);
  }
};

// GET /api/loans/:id
const getLoan = async (req, res, next) => {
  try {
    const loan = await prisma.loan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        ...loanInclude,
        reminderLogs: { orderBy: { sentAt: 'desc' } },
      },
    });
    if (!loan) return notFound(res, 'Loan not found');
    return success(res, { loan: getLoanSnapshot(loan) });
  } catch (err) {
    next(err);
  }
};

// POST /api/loans
const createLoan = async (req, res, next) => {
  try {
    const { borrowerId, amount, interestRate, interestType, startDate, dueDate, notes, reminderEnabled } = req.body;

    if (!borrowerId || !amount || !startDate || !dueDate) {
      return badRequest(res, 'Borrower, amount, startDate and dueDate are required');
    }

    const borrower = await prisma.borrower.findFirst({ where: { id: borrowerId, userId: req.user.id } });
    if (!borrower) return notFound(res, 'Borrower not found');

    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate || 0);
    const type = interestType || 'SIMPLE';

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.walletBalance < principal) {
      return badRequest(res, `Insufficient wallet balance. Available: ₹${user.walletBalance.toLocaleString('en-IN')}`);
    }

    const { totalInterest, totalAmount } = calculateInterest(principal, rate, type, startDate, dueDate);

    const [loan, updatedUser, transaction] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          userId: req.user.id,
          borrowerId,
          amount: principal,
          interestRate: rate,
          interestType: type,
          totalInterest,
          totalAmount,
          paidAmount: 0,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
          status: 'PENDING',
          notes,
          reminderEnabled: reminderEnabled !== false,
        },
        include: loanInclude,
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          walletBalance: { decrement: principal },
          lentOutAmount: { increment: principal }
        }
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          type: 'DEBIT',
          source: 'LOAN_CREATION',
          amount: principal,
          balanceAfter: user.walletBalance - principal,
          notes: `Loan created for ${borrower.name}`
        }
      })
    ]);

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        loanId: loan.id,
        type: 'LOAN_CREATED',
        message: `New loan of ₹${principal.toLocaleString('en-IN')} created for ${borrower.name}.`,
      },
    });

    await syncUserWalletFields(req.user.id);

    // Send email to borrower if email exists
    if (borrower.email) {
      const smtpOverride = {
        host: updatedUser?.smtpHost,
        port: updatedUser?.smtpPort,
        user: updatedUser?.smtpUser,
        pass: updatedUser?.smtpPass,
        from: updatedUser?.smtpFrom,
      };

      await sendLoanCreatedEmail({
        to: borrower.email,
        borrowerName: borrower.name,
        lenderName: updatedUser?.name || 'Credit Mint',
        totalAmount: totalAmount,
        dueDate: new Date(dueDate),
        loanId: loan.id,
        lenderContact: updatedUser?.phone || updatedUser?.email || 'Not provided',
        smtpOverride,
      }).catch((error) => {
        console.error(`[Loan] Failed to send loan creation email to ${borrower.email}:`, error);
      });
    }

    return created(res, { loan: getLoanSnapshot(loan) }, 'Loan created');
  } catch (err) {
    next(err);
  }
};

// PUT /api/loans/:id
const updateLoan = async (req, res, next) => {
  try {
    const existing = await prisma.loan.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return notFound(res, 'Loan not found');

    const { amount, interestRate, interestType, startDate, dueDate, notes, reminderEnabled } = req.body;

    const principal = parseFloat(amount || existing.amount);
    const rate = parseFloat(interestRate !== undefined ? interestRate : existing.interestRate);
    const type = interestType || existing.interestType;
    const sd = startDate ? new Date(startDate) : existing.startDate;
    const dd = dueDate ? new Date(dueDate) : existing.dueDate;

    const { totalInterest, totalAmount } = calculateInterest(principal, rate, type, sd, dd);
    const status = computeLoanStatus(existing.paidAmount, totalAmount, dd);

    const loan = await prisma.loan.update({
      where: { id: req.params.id },
      data: {
        amount: principal,
        interestRate: rate,
        interestType: type,
        totalInterest,
        totalAmount,
        startDate: sd,
        dueDate: dd,
        status,
        ...(notes !== undefined && { notes }),
        ...(reminderEnabled !== undefined && { reminderEnabled }),
      },
      include: loanInclude,
    });

    return success(res, { loan: getLoanSnapshot(loan) }, 'Loan updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/loans/:id
const deleteLoan = async (req, res, next) => {
  try {
    const existing = await prisma.loan.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return notFound(res, 'Loan not found');

    await prisma.loan.delete({ where: { id: req.params.id } });
    return success(res, {}, 'Loan deleted');
  } catch (err) {
    next(err);
  }
};

// POST /api/loans/:id/pay
const recordPayment = async (req, res, next) => {
  try {
    const { amount, note } = req.body;
    if (!amount || parseFloat(amount) <= 0) return badRequest(res, 'Valid payment amount is required');

    const loan = await prisma.loan.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: loanInclude });
    if (!loan) return notFound(res, 'Loan not found');

    const payAmount = parseFloat(amount);
    const snapshot = getLoanSnapshot(loan);
    const remaining = snapshot.collectableAmount;

    if (payAmount > remaining) {
      return badRequest(res, `Payment (₹${payAmount}) exceeds remaining balance (₹${remaining.toFixed(2)})`);
    }

    const effectiveTotalAmount = round2(loan.totalAmount + snapshot.overdueInterest);
    const newPaidAmount = round2(loan.paidAmount + payAmount);
    const newStatus = computeLoanStatus(newPaidAmount, effectiveTotalAmount, loan.dueDate);

    // Wallet logic:
    // When a payment is received:
    // 1. If it's the first payments, we first recover principal.
    // 2. Once principal is recovered, everything else is profit.
    // Simplified version as per user requirement:
    // Return to wallet = total payment amount.
    // Profit = interest part of the payment.
    const principalPaid = Math.min(loan.amount - (loan.paidAmount < loan.amount ? loan.paidAmount : loan.amount), payAmount);
    const interestPaid = payAmount - principalPaid;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const [payment, updatedLoan] = await prisma.$transaction([
      prisma.payment.create({ data: { loanId: loan.id, amount: payAmount, note } }),
      prisma.loan.update({
        where: { id: loan.id },
        data: { paidAmount: newPaidAmount, totalAmount: effectiveTotalAmount, status: newStatus },
        include: loanInclude,
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          walletBalance: { increment: payAmount },
          lentOutAmount: { decrement: principalPaid },
          totalProfit: { increment: interestPaid }
        }
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          loanId: loan.id,
          type: 'CREDIT',
          source: 'REPAYMENT',
          amount: payAmount,
          balanceAfter: user.walletBalance + payAmount,
          notes: `Repayment for ${loan.borrower?.name}. Principal: ₹${principalPaid}, Interest: ₹${interestPaid}`
        }
      })
    ]);

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        loanId: loan.id,
        type: 'PAYMENT_RECEIVED',
        message: `Payment of ₹${payAmount.toLocaleString('en-IN')} received from ${loan.borrower?.name}. ${newStatus === 'PAID' ? 'Loan fully closed!' : `₹${(effectiveTotalAmount - newPaidAmount).toLocaleString('en-IN')} remaining.`}`,
      },
    });

    await syncUserWalletFields(req.user.id);

    await sendPaymentEmailIfPossible(loan, payAmount, note);

    return success(res, { payment, loan: getLoanSnapshot(updatedLoan) }, 'Payment recorded');
  } catch (err) {
    next(err);
  }
};

// POST /api/loans/:id/collect-interest
const collectInterest = async (req, res, next) => {
  try {
    const { note } = req.body;

    const loan = await prisma.loan.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: loanInclude });
    if (!loan) return notFound(res, 'Loan not found');
    if (loan.interestType !== 'MONTHLY') return badRequest(res, 'Interest collection is only available for monthly loans');
    if (loan.status === 'PAID') return badRequest(res, 'This loan is already fully paid');

    const snapshot = getLoanSnapshot(loan);
    const interestAmount = round2(snapshot.monthlyInterestAmount + snapshot.overdueInterest);
    if (interestAmount <= 0) return badRequest(res, 'Monthly interest amount must be greater than zero');

    const extensionBaseDate = snapshot.overdueDays > 0 ? new Date() : loan.dueDate;
    const nextDueDate = addOneMonth(extensionBaseDate);
    const nextCycleInterest = snapshot.monthlyInterestAmount;
    const totalAmount = round2(loan.totalAmount + snapshot.overdueInterest + nextCycleInterest);
    const totalInterest = round2(totalAmount - loan.amount);
    const newPaidAmount = round2(loan.paidAmount + interestAmount);
    const newStatus = computeLoanStatus(newPaidAmount, totalAmount, nextDueDate);
    const paymentNote = note?.trim() || `Monthly interest collected. Extended to ${nextDueDate.toLocaleDateString('en-IN')}.`;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const [payment, updatedLoan] = await prisma.$transaction([
      prisma.payment.create({ data: { loanId: loan.id, amount: interestAmount, note: paymentNote } }),
      prisma.loan.update({
        where: { id: loan.id },
        data: {
          dueDate: nextDueDate,
          totalInterest,
          totalAmount,
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: loanInclude,
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          walletBalance: { increment: interestAmount },
          totalProfit: { increment: interestAmount }
        }
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          loanId: loan.id,
          type: 'CREDIT',
          source: 'INTEREST_COLLECTION',
          amount: interestAmount,
          balanceAfter: user.walletBalance + interestAmount,
          notes: `Interest collected from ${loan.borrower?.name}. Extension: ${nextDueDate.toLocaleDateString('en-IN')}`
        }
      })
    ]);

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        loanId: loan.id,
        type: 'PAYMENT_RECEIVED',
        message: `Interest of ₹${interestAmount.toLocaleString('en-IN')} collected from ${loan.borrower?.name}. Due date moved to ${nextDueDate.toLocaleDateString('en-IN')}.`,
      },
    });

    await syncUserWalletFields(req.user.id);

    await sendInterestEmailIfPossible(loan, interestAmount, nextDueDate, totalAmount);

    return success(res, { payment, loan: getLoanSnapshot(updatedLoan), interestAmount }, 'Interest collected and due date extended');
  } catch (err) {
    next(err);
  }
};

module.exports = { getLoans, getLoan, createLoan, updateLoan, deleteLoan, recordPayment, collectInterest };
