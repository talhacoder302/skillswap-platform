const { protect } = require(`${__middelwares}/auth`);
const { checkRole } = require(`${__middelwares}/roles`);

module.exports = (router, controller) => {
  router.get("/notifications", protect, controller.getMyNotifications);
  router.patch(
    "/notifications/:notificationId/read",
    protect,
    controller.markAsRead,
  );
  router.get("/notifications/unread-count", protect, controller.getUnreadCount);
};
