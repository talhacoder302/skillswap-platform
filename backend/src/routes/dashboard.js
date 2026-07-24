const { protect } = require(`${__middelwares}/auth`);
const { checkRole } = require(`${__middelwares}/roles`);

module.exports = (router, controller) => {
  router.get("/dashboard/stats", protect, controller.getDashboardStats);
  router.get(
    "/dashboard/recent-activity",
    protect,
    controller.getRecentActivity,
  );
  router.get(
    "/admin/dashboard",
    protect,
    checkRole("admin"),
    controller.getAdminDashboard,
  );
};
