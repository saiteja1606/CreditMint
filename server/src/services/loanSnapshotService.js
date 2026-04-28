const round2 = (value) => Math.round(value * 100) / 100;

const diffWholeDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
};

const getLoanSnapshot = (loan, asOf = new Date()) => {
  const baseRemaining = Math.max(0, round2(loan.totalAmount - loan.paidAmount));
  const monthlyInterestAmount = loan.interestType === 'MONTHLY'
    ? round2((loan.amount * loan.interestRate) / 100)
    : 0;
  const overdueDays = loan.status === 'PAID' ? 0 : diffWholeDays(loan.dueDate, asOf);
  const overdueInterest = loan.interestType === 'MONTHLY' && overdueDays > 0
    ? round2((monthlyInterestAmount / 30) * overdueDays)
    : 0;
  const collectableAmount = round2(baseRemaining + overdueInterest);

  return {
    ...loan,
    monthlyInterestAmount,
    overdueDays,
    overdueInterest,
    collectableAmount,
    remainingAmount: collectableAmount,
  };
};

module.exports = { getLoanSnapshot, round2 };
