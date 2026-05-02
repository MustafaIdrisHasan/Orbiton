const service = require("./service");

function viewerOf(req) {
  const userId = req.user?.userId || req.user?.id || null;
  const role = req.user?.role || req.user?.roles?.[0] || null;
  return { userId, role };
}

async function listNotifications(req, res, next) {
  try {
    const { userId, role } = viewerOf(req);
    const data = await service.listNotifications(userId, role);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { userId } = viewerOf(req);
    const notification = await service.markAsRead(req.params.id, userId);
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    res.json({ id: notification.id, message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const { userId } = viewerOf(req);
    const updated = await service.markAllAsRead(userId);
    res.json({ updated, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
}

async function broadcast(req, res, next) {
  try {
    const result = await service.createBroadcast(req.body || {});
    res.status(201).json({ message: "Broadcast queued", ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markAsRead, markAllAsRead, broadcast };
