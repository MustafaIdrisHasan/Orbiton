const service = require("./service");

function listNotifications(_req, res) {
  res.json(service.listNotifications());
}

function markAsRead(req, res) {
  const notification = service.markAsRead(req.params.id);
  if (!notification) {
    res.status(404).json({ message: "Notification not found" });
    return;
  }

  res.json({
    id: notification.id,
    message: "Notification marked as read"
  });
}

function broadcast(req, res) {
  res.status(201).json({
    message: "Broadcast queued",
    item: service.createBroadcast(req.body)
  });
}

module.exports = {
  listNotifications,
  markAsRead,
  broadcast
};
