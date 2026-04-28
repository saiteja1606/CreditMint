const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Credit Mint database...');

  // Clear existing data
  await prisma.reminderLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.borrower.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Arjun Sharma',
      email: 'demo@creditmint.app',
      password: hashedPassword,
      phone: '+91 98765 43210',
      reminderEnabled: true,
      reminderDaysBefore: 1,
    },
  });
  console.log('✅ Created user:', user.email);

  // Create borrowers
  const borrowers = await Promise.all([
    prisma.borrower.create({
      data: {
        userId: user.id, name: 'Ravi Kumar', phone: '+91 99001 11234',
        email: 'ravi.kumar@example.com', address: 'Chennai, Tamil Nadu',
        notes: 'Trusted borrower, always pays on time',
      },
    }),
    prisma.borrower.create({
      data: {
        userId: user.id, name: 'Meena Patel', phone: '+91 99002 22345',
        email: 'meena.patel@example.com', address: 'Ahmedabad, Gujarat',
        notes: 'Small business owner',
      },
    }),
    prisma.borrower.create({
      data: {
        userId: user.id, name: 'Vikram Singh', phone: '+91 99003 33456',
        email: 'vikram.singh@example.com', address: 'Jaipur, Rajasthan',
      },
    }),
    prisma.borrower.create({
      data: {
        userId: user.id, name: 'Priya Nair', phone: '+91 99004 44567',
        email: 'priya.nair@example.com', address: 'Kochi, Kerala',
      },
    }),
    prisma.borrower.create({
      data: {
        userId: user.id, name: 'Suresh Reddy', phone: '+91 99005 55678',
        email: 'suresh.reddy@example.com', address: 'Hyderabad, Telangana',
      },
    }),
    prisma.borrower.create({
      data: {
        userId: user.id, name: 'Anita Desai', phone: '+91 99006 66789',
        email: 'anita.desai@example.com', address: 'Mumbai, Maharashtra',
      },
    }),
  ]);
  console.log('✅ Created', borrowers.length, 'borrowers');

  const now = new Date();
  const past = (days) => { const d = new Date(now); d.setDate(d.getDate() - days); return d; };
  const future = (days) => { const d = new Date(now); d.setDate(d.getDate() + days); return d; };

  // Create loans with mixed statuses
  const loansData = [
    // PAID loans
    {
      borrowerId: borrowers[0].id, amount: 50000, interestRate: 12, interestType: 'SIMPLE',
      totalInterest: 5000, totalAmount: 55000, paidAmount: 55000, status: 'PAID',
      startDate: past(180), dueDate: past(10), reminderEnabled: true,
    },
    {
      borrowerId: borrowers[1].id, amount: 25000, interestRate: 10, interestType: 'SIMPLE',
      totalInterest: 2083, totalAmount: 27083, paidAmount: 27083, status: 'PAID',
      startDate: past(120), dueDate: past(30), reminderEnabled: true,
    },
    // OVERDUE loans
    {
      borrowerId: borrowers[2].id, amount: 75000, interestRate: 14, interestType: 'SIMPLE',
      totalInterest: 8750, totalAmount: 83750, paidAmount: 20000, status: 'OVERDUE',
      startDate: past(90), dueDate: past(15), reminderEnabled: true,
    },
    {
      borrowerId: borrowers[3].id, amount: 30000, interestRate: 2, interestType: 'MONTHLY',
      totalInterest: 3600, totalAmount: 33600, paidAmount: 0, status: 'OVERDUE',
      startDate: past(60), dueDate: past(5), reminderEnabled: true,
    },
    // PENDING loans
    {
      borrowerId: borrowers[0].id, amount: 100000, interestRate: 12, interestType: 'SIMPLE',
      totalInterest: 10000, totalAmount: 110000, paidAmount: 30000, status: 'PENDING',
      startDate: past(60), dueDate: future(30), reminderEnabled: true,
    },
    {
      borrowerId: borrowers[4].id, amount: 45000, interestRate: 1.5, interestType: 'MONTHLY',
      totalInterest: 2025, totalAmount: 47025, paidAmount: 0, status: 'PENDING',
      startDate: past(30), dueDate: future(60), reminderEnabled: true,
    },
    {
      borrowerId: borrowers[1].id, amount: 20000, interestRate: 10, interestType: 'SIMPLE',
      totalInterest: 1667, totalAmount: 21667, paidAmount: 0, status: 'PENDING',
      startDate: past(10), dueDate: future(1), reminderEnabled: true, // due tomorrow!
    },
    {
      borrowerId: borrowers[5].id, amount: 60000, interestRate: 12, interestType: 'SIMPLE',
      totalInterest: 6000, totalAmount: 66000, paidAmount: 0, status: 'PENDING',
      startDate: past(5), dueDate: future(0), reminderEnabled: true, // due today!
    },
    {
      borrowerId: borrowers[3].id, amount: 15000, interestRate: 0, interestType: 'SIMPLE',
      totalInterest: 0, totalAmount: 15000, paidAmount: 0, status: 'PENDING',
      startDate: past(20), dueDate: future(10), reminderEnabled: false,
    },
    {
      borrowerId: borrowers[4].id, amount: 80000, interestRate: 14, interestType: 'SIMPLE',
      totalInterest: 9333, totalAmount: 89333, paidAmount: 0, status: 'PENDING',
      startDate: past(15), dueDate: future(75), reminderEnabled: true,
    },
  ];

  const loans = [];
  for (const ld of loansData) {
    const loan = await prisma.loan.create({
      data: { userId: user.id, ...ld },
    });
    loans.push(loan);
  }
  console.log('✅ Created', loans.length, 'loans');

  // Add payments to paid loans
  await prisma.payment.create({ data: { loanId: loans[0].id, amount: 55000, note: 'Full payment received', paidAt: past(10) } });
  await prisma.payment.create({ data: { loanId: loans[1].id, amount: 27083, note: 'Cleared', paidAt: past(30) } });
  // Partial payments on overdue/pending
  await prisma.payment.create({ data: { loanId: loans[2].id, amount: 20000, note: 'Partial payment', paidAt: past(20) } });
  await prisma.payment.create({ data: { loanId: loans[4].id, amount: 30000, note: 'Part 1', paidAt: past(15) } });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: user.id, loanId: loans[2].id, type: 'OVERDUE', message: 'Loan of ₹75,000 from Vikram Singh is overdue by 15 days.', isRead: false },
      { userId: user.id, loanId: loans[3].id, type: 'OVERDUE', message: 'Loan of ₹30,000 from Priya Nair is overdue by 5 days.', isRead: false },
      { userId: user.id, loanId: loans[6].id, type: 'DUE_TOMORROW', message: 'Loan of ₹20,000 from Meena Patel is due tomorrow.', isRead: false },
      { userId: user.id, loanId: loans[7].id, type: 'DUE_TODAY', message: 'Loan of ₹60,000 from Anita Desai is due today!', isRead: false },
      { userId: user.id, loanId: loans[0].id, type: 'PAYMENT_RECEIVED', message: 'Payment of ₹55,000 received from Ravi Kumar. Loan fully closed.', isRead: true },
      { userId: user.id, loanId: loans[4].id, type: 'PAYMENT_RECEIVED', message: 'Partial payment of ₹30,000 received from Ravi Kumar.', isRead: true },
    ],
  });

  // Create reminder logs
  await prisma.reminderLog.createMany({
    data: [
      { loanId: loans[2].id, type: 'IN_APP', status: 'SENT', sentAt: past(1) },
      { loanId: loans[2].id, type: 'EMAIL', status: 'DISABLED', sentAt: past(1) },
      { loanId: loans[3].id, type: 'IN_APP', status: 'SENT', sentAt: past(1) },
      { loanId: loans[6].id, type: 'IN_APP', status: 'SENT', sentAt: new Date() },
      { loanId: loans[7].id, type: 'IN_APP', status: 'SENT', sentAt: new Date() },
    ],
  });

  console.log('✅ Created notifications and reminder logs');
  console.log('\n🎉 Seed complete! Login with:');
  console.log('   Email:    demo@creditmint.app');
  console.log('   Password: password123');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
