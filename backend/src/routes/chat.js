const { protect } = require(`${__middelwares}/auth`);
const { checkRole } = require(`${__middelwares}/roles`);

module.exports = (router, controller) => {
  router.post("/chat/conversation", protect, controller.createConversation);
  router.post("/chat/message", protect, controller.sendMessage);
  router.get("/chat/conversations", protect, controller.getConversations);
  router.get("/chat/messages/:conversationId", protect, controller.getMessages);
  router.patch(
    "/chat/messages/:conversationId/read",
    protect,
    controller.markMessagesAsRead,
  );
};
