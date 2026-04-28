const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/apiResponse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, phone: true, reminderEnabled: true, reminderDaysBefore: true, createdAt: true },
    });

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

module.exports = { authenticate };
