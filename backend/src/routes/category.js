const { protect } = require(`${__middelwares}/auth`);
const { checkRole } = require(`${__middelwares}/roles`);

module.exports = (router, controller) => {
  router.post(
    "/categories",
    protect,
    checkRole("admin"),
    controller.createCategory,
  );

  router.get("/categories", protect, controller.getCategories);

  router.get("/categories/:id", protect, controller.getCategoryById);

  router.put(
    "/categories/:id",
    protect,
    checkRole("admin"),
    controller.updateCategory,
  );

  router.delete(
    "/categories/:id",
    protect,
    checkRole("admin"),
    controller.deleteCategory,
  );
};
