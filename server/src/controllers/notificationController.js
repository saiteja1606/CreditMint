const { PrismaClient } = require('@prisma/client');
const { success } = require('../utils/apiResponse');

const prisma = new PrismaClient();

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        loan: {
          select: { id: true, amount: true, dueDate: true, borrower: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return success(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    return success(res, {}, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
