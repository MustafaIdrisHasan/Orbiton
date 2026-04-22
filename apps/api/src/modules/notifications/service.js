const repository = require("./repository");

function listNotifications() {
  const items = repository.listNotifications();
  return {
    items,
    unreadCount: items.filter((item) => !item.isRead).length
  };
}

function markAsRead(id) {
  return repository.markAsRead(id);
}

function createBroadcast(payload) {
  return repository.createBroadcast(payload);
}

module.exports = {
  listNotifications,
  markAsRead,
  createBroadcast
};
