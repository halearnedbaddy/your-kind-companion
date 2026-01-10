import { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * Get user's notifications
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications', code: 'SERVER_ERROR' });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found', code: 'NOT_FOUND' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification', code: 'SERVER_ERROR' });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notifications', code: 'SERVER_ERROR' });
  }
};

/**
 * Create notification (internal use)
 */
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        data,
      },
    });

    // TODO: Send push notification / SMS based on user preferences

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

/**
 * Notify seller about payment received (funds secured)
 */
export const notifyPaymentReceived = async (transaction: any) => {
  return createNotification(
    transaction.sellerId,
    'PAYMENT_RECEIVED',
    'Funds Secured! 🎉',
    `KES ${transaction.amount.toLocaleString()} received for "${transaction.itemName}". Ship the item now.`,
    { transactionId: transaction.id, amount: transaction.amount }
  );
};

/**
 * Notify buyer about order accepted
 */
export const notifyOrderAccepted = async (transaction: any) => {
  if (!transaction.buyerId) return null;
  return createNotification(
    transaction.buyerId,
    'ORDER_ACCEPTED',
    'Order Accepted ✓',
    `Seller has accepted your order for "${transaction.itemName}". Shipping soon.`,
    { transactionId: transaction.id }
  );
};

/**
 * Notify buyer about shipment
 */
export const notifyItemShipped = async (transaction: any) => {
  if (!transaction.buyerId) return null;
  return createNotification(
    transaction.buyerId,
    'ITEM_SHIPPED',
    'Item Shipped! 📦',
    `Your order "${transaction.itemName}" has been shipped. Tracking: ${transaction.trackingNumber || 'N/A'}`,
    { transactionId: transaction.id, trackingNumber: transaction.trackingNumber }
  );
};

/**
 * Notify seller about delivery confirmation
 */
export const notifyDeliveryConfirmed = async (transaction: any) => {
  const sellerPayout = transaction.sellerPayout || transaction.amount * 0.95;
  return createNotification(
    transaction.sellerId,
    'DELIVERY_CONFIRMED',
    'Funds Released! 💰',
    `KES ${sellerPayout.toLocaleString()} has been added to your wallet for "${transaction.itemName}".`,
    { transactionId: transaction.id, amount: sellerPayout }
  );
};

/**
 * Notify about dispute opened
 */
export const notifyDisputeOpened = async (transaction: any, dispute: any) => {
  // Notify seller
  await createNotification(
    transaction.sellerId,
    'DISPUTE_OPENED',
    'Dispute Opened ⚠️',
    `A dispute has been opened for "${transaction.itemName}". Reason: ${dispute.reason}`,
    { transactionId: transaction.id, disputeId: dispute.id }
  );

  // Notify buyer if registered
  if (transaction.buyerId) {
    await createNotification(
      transaction.buyerId,
      'DISPUTE_OPENED',
      'Dispute Submitted',
      `Your dispute for "${transaction.itemName}" has been submitted. We'll review within 48 hours.`,
      { transactionId: transaction.id, disputeId: dispute.id }
    );
  }
};
