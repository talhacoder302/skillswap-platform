const { protect } = require(`${__middelwares}/auth`);
const { checkRole } = require(`${__middelwares}/roles`);

module.exports = (router, controller) => {
  router.post("/feedback", protect, controller.submitFeedback);
  router.get("/feedback/received", protect, controller.getReceivedFeedback);
  router.get("/feedback/rating", protect, controller.getMyRating);
  router.get("/feedback/given", protect, controller.getGivenFeedback);
};
