const { PrismaClient } = require('@prisma/client');
const { success, created, notFound, badRequest } = require('../utils/apiResponse');
const { getLoanSnapshot } = require('../services/loanSnapshotService');

const prisma = new PrismaClient();

const borrowerWithStats = async (borrower) => {
  const loans = await prisma.loan.findMany({
    where: { borrowerId: borrower.id },
    select: { id: true, amount: true, interestRate: true, interestType: true, totalAmount: true, paidAmount: true, status: true, dueDate: true, startDate: true },
  });

  const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0);
  const outstanding = loans.reduce((s, l) => s + getLoanSnapshot(l).collectableAmount, 0);
  const activeLoans = loans.filter(l => l.status !== 'PAID').length;
  const paidLoans = loans.filter(l => l.status === 'PAID').length;

  return { ...borrower, totalBorrowed, outstanding, activeLoans, paidLoans, loanCount: loans.length };
};

// GET /api/borrowers
const getBorrowers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const borrowers = await prisma.borrower.findMany({
      where: {
        userId: req.user.id,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const withStats = await Promise.all(borrowers.map(borrowerWithStats));
    return success(res, { borrowers: withStats });
  } catch (err) {
    next(err);
  }
};

// GET /api/borrowers/:id
const getBorrower = async (req, res, next) => {
  try {
    const borrower = await prisma.borrower.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!borrower) return notFound(res, 'Borrower not found');

    const loans = await prisma.loan.findMany({
      where: { borrowerId: borrower.id },
      include: { payments: { orderBy: { paidAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const reminderLogs = await prisma.reminderLog.findMany({
      where: { loanId: { in: loans.map(l => l.id) } },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });

    const stats = await borrowerWithStats(borrower);
    return success(res, { borrower: { ...stats, loans: loans.map(getLoanSnapshot), reminderLogs } });
  } catch (err) {
    next(err);
  }
};

// POST /api/borrowers
const createBorrower = async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (!name) return badRequest(res, 'Name is required');

    const borrower = await prisma.borrower.create({
      data: { userId: req.user.id, name, phone, email, address, notes },
    });
    return created(res, { borrower }, 'Borrower added');
  } catch (err) {
    next(err);
  }
};

// PUT /api/borrowers/:id
const updateBorrower = async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const existing = await prisma.borrower.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return notFound(res, 'Borrower not found');

    const borrower = await prisma.borrower.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), phone, email, address, notes },
    });
    return success(res, { borrower }, 'Borrower updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/borrowers/:id
const deleteBorrower = async (req, res, next) => {
  try {
    const existing = await prisma.borrower.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return notFound(res, 'Borrower not found');

    await prisma.borrower.delete({ where: { id: req.params.id } });
    return success(res, {}, 'Borrower deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getBorrowers, getBorrower, createBorrower, updateBorrower, deleteBorrower };
