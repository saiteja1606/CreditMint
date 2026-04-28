const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { success, created, badRequest, unauthorized, error } = require('../utils/apiResponse');
const { syncUserWalletFields } = require('../services/walletService');

const prisma = new PrismaClient();
const normalizeEmail = (email) => email.trim().toLowerCase();

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, initialBalance } = req.body;
    const normalizedEmail = email ? normalizeEmail(email) : '';

    if (!name || !normalizedEmail || !password) {
      return badRequest(res, 'Name, email and password are required');
    }
    if (password.length < 6) {
      return badRequest(res, 'Password must be at least 6 characters');
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: email.trim() },
        ],
      },
    });
    if (existing) {
      return badRequest(res, 'Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: normalizedEmail, 
        password: hashed, 
        phone,
        initialBalance: parseFloat(initialBalance || 0),
        walletBalance: parseFloat(initialBalance || 0)
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    const token = generateToken({ id: user.id, email: user.email });
    return created(res, { user, token }, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email ? email.trim() : '';
    const normalizedEmail = trimmedEmail ? normalizeEmail(trimmedEmail) : '';

    if (!trimmedEmail || !password) {
      return badRequest(res, 'Email and password are required');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: trimmedEmail === normalizedEmail
          ? [{ email: normalizedEmail }]
          : [{ email: trimmedEmail }, { email: normalizedEmail }],
      },
    });
    if (!user) {
      return unauthorized(res, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return unauthorized(res, 'Invalid email or password');
    }

    const token = generateToken({ id: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;
    return success(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    return success(res, { user: req.user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, initialBalance, reminderEnabled, reminderDaysBefore, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(initialBalance !== undefined && { initialBalance: parseFloat(initialBalance) }),
        ...(reminderEnabled !== undefined && { reminderEnabled }),
        ...(reminderDaysBefore !== undefined && { reminderDaysBefore: parseInt(reminderDaysBefore) }),
        ...(smtpHost !== undefined && { smtpHost }),
        ...(smtpPort !== undefined && { smtpPort: smtpPort ? parseInt(smtpPort) : null }),
        ...(smtpUser !== undefined && { smtpUser }),
        ...(smtpPass !== undefined && { smtpPass }),
        ...(smtpFrom !== undefined && { smtpFrom }),
      },
      select: { id: true, name: true, email: true, phone: true, reminderEnabled: true, reminderDaysBefore: true, smtpHost: true, smtpPort: true, smtpUser: true, smtpFrom: true, createdAt: true },
    });

    if (initialBalance !== undefined) {
      await syncUserWalletFields(req.user.id);
    }

    return success(res, { user: updated }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return badRequest(res, 'Current and new password are required');
    }
    if (newPassword.length < 6) {
      return badRequest(res, 'New password must be at least 6 characters');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return unauthorized(res, 'Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    return success(res, {}, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
