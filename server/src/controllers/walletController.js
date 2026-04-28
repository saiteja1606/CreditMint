const { PrismaClient } = require('@prisma/client');
const { success, notFound, badRequest } = require('../utils/apiResponse');

const prisma = new PrismaClient();

// GET /api/wallet/transactions
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user.id },
      include: {
        loan: {
          select: {
            id: true,
            borrower: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, { transactions });
  } catch (err) {
    next(err);
  }
};

const { getWalletSummary: fetchWalletSummary } = require('../services/walletService');

// GET /api/wallet/summary
const getWalletSummary = async (req, res, next) => {
  try {
    const summary = await fetchWalletSummary(req.user.id);

    return success(res, { 
      summary 
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/adjust (Manual Adjustment)
const adjustBalance = async (req, res, next) => {
  try {
    const { amount, type, notes } = req.body; // type: CREDIT or DEBIT

    if (!amount || parseFloat(amount) <= 0) {
      return badRequest(res, 'Valid amount is required');
    }

    const adjAmount = parseFloat(amount);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    let newBalance = user.walletBalance;
    if (type === 'CREDIT') {
      newBalance += adjAmount;
    } else if (type === 'DEBIT') {
      if (user.walletBalance < adjAmount) {
        return badRequest(res, 'Insufficient wallet balance');
      }
      newBalance -= adjAmount;
    } else {
      return badRequest(res, 'Invalid transaction type');
    }

    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { walletBalance: newBalance }
      }),
      prisma.walletTransaction.create({
        data: {
          userId: req.user.id,
          type,
          source: 'MANUAL_ADJUSTMENT',
          amount: adjAmount,
          balanceAfter: newBalance,
          notes
        }
      })
    ]);

    return success(res, { user: updatedUser, transaction }, 'Balance adjusted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTransactions, getWalletSummary, adjustBalance };
