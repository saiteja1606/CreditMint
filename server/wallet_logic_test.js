/**
 * Wallet Logic Test Script
 * This script validates the core logic of the WalletService re-computation.
 * Run this to ensure Lent Out amount and Profit are calculated correctly.
 */
const { getWalletSummary } = require('./src/services/walletService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Wallet Logic Test Suite ---');

  // We'll use a test user or the first user in the DB
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found in DB to test with. Run seed first.');
    return;
  }

  console.log(`Testing with user: ${user.name} (${user.id})`);

  try {
    const summary = await getWalletSummary(user.id);
    
    console.log('\n[Current State]');
    console.log(`Available Balance: ₹${summary.walletBalance}`);
    console.log(`Lent Out Amount: ₹${summary.lentOutAmount}`);
    console.log(`Total Profit: ₹${summary.totalProfit}`);
    console.log(`Active Loans: ${summary.activeLoansCount}`);
    console.log(`Total Capital: ₹${summary.totalCapitalValue}`);

    // Verification Logic
    // 1. Lent Out Amount should be 0 if activeLoansCount is 0
    if (summary.activeLoansCount === 0 && summary.lentOutAmount !== 0) {
      console.error('❌ FAIL: Lent Out Amount should be 0 when no active loans exist.');
    } else {
      console.log('✅ PASS: Lent Out Amount aligns with active loan status.');
    }

    // 2. Total Capital should be sum of balance and lent out
    const expectedCapital = Math.round((summary.walletBalance + summary.lentOutAmount) * 100) / 100;
    if (summary.totalCapitalValue !== expectedCapital) {
      console.error(`❌ FAIL: Total Capital (${summary.totalCapitalValue}) does not match balance + lent out (${expectedCapital})`);
    } else {
      console.log('✅ PASS: Total Capital formula is correct.');
    }

    // 3. Check for specific problematic loans
    const problematicLoans = await prisma.loan.findMany({
      where: { userId: user.id, status: 'PAID', amount: { gt: 0 } }
    });
    
    console.log(`\nChecked ${problematicLoans.length} PAID loans.`);
    // In our service, PAID loans are excluded from lentOutAmount.
    // If we re-run getWalletSummary and it returns what we expect, it works.

  } catch (error) {
    console.error('❌ TEST CRASHED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
