const { protect } = require(`${__middelwares}/auth`);
const { checkRole } = require(`${__middelwares}/roles`);

module.exports = (router, controller) => {
  router.post("/skills", protect, checkRole("admin"), controller.createSkill);
  router.get("/skills", protect, controller.getSkills);
  router.get("/skills/:id", protect, controller.getSkillById);
  router.put(
    "/skills/:id",
    protect,
    checkRole("admin"),
    controller.updateSkill,
  );
  router.delete(
    "/skills/:id",
    protect,
    checkRole("admin"),
    controller.deleteSkill,
  );
};
