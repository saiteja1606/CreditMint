const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('./emailService');
const { getLoanSnapshot } = require('./loanSnapshotService');

const prisma = new PrismaClient();

const processReminders = async (loans, reminderType, notificationType, messageBuilder, extraEmailPayloadBuilder = () => ({})) => {
  const stats = {
    sent: 0,
    failed: 0,
    loansChecked: loans.length,
  };

  for (const loan of loans) {
    try {
      const snapshot = getLoanSnapshot(loan);
      const message = messageBuilder(snapshot);

      await prisma.notification.create({
        data: {
          userId: loan.userId,
          loanId: loan.id,
          type: notificationType,
          message,
        },
      });

      await prisma.reminderLog.create({
        data: { loanId: loan.id, type: 'IN_APP', status: 'SENT' },
      });

      if (loan.reminderEnabled && loan.borrower?.email) {
        const user = await prisma.user.findUnique({ where: { id: loan.userId } });
        const smtpOverride = {
          host: user?.smtpHost,
          port: user?.smtpPort,
          user: user?.smtpUser,
          pass: user?.smtpPass,
          from: user?.smtpFrom,
        };

        const result = await sendReminderEmail({
          templateType: reminderType,
          to: loan.borrower.email,
          borrowerName: loan.borrower.name,
          lenderName: user?.name || 'Credit Mint',
          amount: snapshot.collectableAmount,
          dueDate: loan.dueDate,
          loanType: loan.interestType,
          ...extraEmailPayloadBuilder(loan, snapshot),
          overdueDays: snapshot.overdueDays,
          smtpOverride,
        });

        await prisma.reminderLog.create({
          data: {
            loanId: loan.id,
            type: 'EMAIL',
            status: result.sent ? 'SENT' : (result.reason === 'SMTP not configured' ? 'DISABLED' : 'FAILED'),
            error: result.error || result.reason || null,
          },
        });

        if (result.sent) {
          stats.sent += 1;
        } else if (result.reason !== 'SMTP not configured') {
          stats.failed += 1;
        }
      }
    } catch (err) {
      console.error(`[Reminder] Error processing loan ${loan.id}:`, err.message);
      stats.failed += 1;
      try {
        await prisma.reminderLog.create({
          data: { loanId: loan.id, type: 'IN_APP', status: 'FAILED', error: err.message },
        });
      } catch (_) {}
    }
  }

  return stats;
};

const runDailyReminders = async () => {
  console.log('[Cron] Running daily reminder check...');

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfThreeDaysAhead = new Date(now); startOfThreeDaysAhead.setDate(startOfThreeDaysAhead.getDate() + 3); startOfThreeDaysAhead.setHours(0, 0, 0, 0);
  const endOfThreeDaysAhead = new Date(now); endOfThreeDaysAhead.setDate(endOfThreeDaysAhead.getDate() + 3); endOfThreeDaysAhead.setHours(23, 59, 59, 999);
  const startOfTomorrow = new Date(now); startOfTomorrow.setDate(startOfTomorrow.getDate() + 1); startOfTomorrow.setHours(0, 0, 0, 0);
  const endOfTomorrow = new Date(now); endOfTomorrow.setDate(endOfTomorrow.getDate() + 1); endOfTomorrow.setHours(23, 59, 59, 999);

  const loanSelect = {
    id: true,
    userId: true,
    amount: true,
    interestRate: true,
    interestType: true,
    totalAmount: true,
    paidAmount: true,
    dueDate: true,
    status: true,
    reminderEnabled: true,
    borrower: { select: { name: true, email: true } },
  };

  await prisma.loan.updateMany({
    where: { status: 'PENDING', dueDate: { lt: startOfToday } },
    data: { status: 'OVERDUE' },
  });

  const dueInThreeDays = await prisma.loan.findMany({
    where: { status: 'PENDING', dueDate: { gte: startOfThreeDaysAhead, lte: endOfThreeDaysAhead } },
    select: loanSelect,
  });

  const dueTomorrow = await prisma.loan.findMany({
    where: { status: 'PENDING', dueDate: { gte: startOfTomorrow, lte: endOfTomorrow } },
    select: loanSelect,
  });

  const overdue = await prisma.loan.findMany({
    where: { status: 'OVERDUE', dueDate: { lt: startOfToday } },
    select: loanSelect,
  });

  const fmt = (loan) =>
    `₹${getLoanSnapshot(loan).collectableAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const dueInThreeDaysStats = await processReminders(
    dueInThreeDays,
    'DUE_TOMORROW',
    'DUE_TOMORROW',
    (loan) => `Loan of ${fmt(loan)} from ${loan.borrower?.name || 'Unknown'} is due in 3 days.`,
    () => ({ daysUntilDue: 3 })
  );

  const dueTomorrowStats = await processReminders(
    dueTomorrow,
    'DUE_TOMORROW',
    'DUE_TOMORROW',
    (loan) => `Loan of ${fmt(loan)} from ${loan.borrower?.name || 'Unknown'} is due tomorrow.`,
    () => ({ daysUntilDue: 1 })
  );

  const overdueStats = await processReminders(
    overdue,
    'OVERDUE',
    'OVERDUE',
    (loan) => `Loan of ${fmt(loan)} from ${loan.borrower?.name || 'Unknown'} is overdue by ${getLoanSnapshot(loan).overdueDays} day(s).`
  );

  console.log(`[Cron] Done. Due in 3 days: ${dueInThreeDays.length}, Due tomorrow: ${dueTomorrow.length}, Overdue: ${overdue.length}`);

  return {
    sent: dueInThreeDaysStats.sent + dueTomorrowStats.sent + overdueStats.sent,
    failed: dueInThreeDaysStats.failed + dueTomorrowStats.failed + overdueStats.failed,
    loansChecked: dueInThreeDaysStats.loansChecked + dueTomorrowStats.loansChecked + overdueStats.loansChecked,
  };
};

module.exports = { runDailyReminders };
