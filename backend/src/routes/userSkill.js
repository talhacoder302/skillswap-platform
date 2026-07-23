const { protect } = require(`${__middelwares}/auth`);

module.exports = (router, controller) => {
  router.post("/user-skills", protect, controller.addUserSkill);
  router.get("/user-skills", protect, controller.getMySkills);
  router.put("/user-skills/:id", protect, controller.updateUserSkill);
  router.delete("/user-skills/:id", protect, controller.deleteUserSkill);
};
