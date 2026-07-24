const { protect } = require(`${__middelwares}/auth`);

module.exports = (router, controller) => {
  router.post("/swap-requests", protect, controller.sendSwapRequest);
  router.get(
    "/swap-requests/received",
    protect,
    controller.getReceivedRequests,
  );
  router.get("/swap-requests/sent", protect, controller.getSentRequests);
  router.patch(
    "/swap-requests/:requestId/accept",
    protect,
    controller.acceptSwapRequest,
  );
  router.patch(
    "/swap-requests/:requestId/reject",
    protect,
    controller.rejectSwapRequest,
  );
  router.patch(
    "/swap-requests/:requestId/cancel",
    protect,
    controller.cancelSwapRequest,
  );
  router.patch(
    "/swap-requests/:requestId/complete",
    protect,
    controller.completeSwapRequest,
  );
  router.get(
    "/swap-requests/:requestId",
    protect,
    controller.getSwapRequestById,
  );
};
