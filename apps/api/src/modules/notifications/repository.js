const { recruiterStore } = require("../recruiters/mockData");

function listNotifications() {
  return recruiterStore.notifications;
}

function markAsRead(id) {
  const notification = recruiterStore.notifications.find((item) => item.id === id);
  if (!notification) {
    return null;
  }

  notification.isRead = true;
  return notification;
}

function createBroadcast(payload) {
  const notification = {
    id: `msg-${Date.now()}`,
    driveId: payload.driveId,
    audience: payload.audience,
    message: payload.message,
    sentAt: new Date().toISOString(),
    isRead: false
  };

  recruiterStore.notifications.unshift(notification);
  return notification;
}

module.exports = {
  listNotifications,
  markAsRead,
  createBroadcast
};
