const { protect } = require(`${__middelwares}/auth`);
const { uploadProfileImage } = require(`${__utils}/fileUploader`);

module.exports = (router, controller) => {
  router.post("/auth/register", controller.register);

  router.post("/auth/login", controller.login);

  router.get("/auth/me", protect, controller.getProfile);

  router.put("/auth/profile", protect, uploadProfileImage.single("profileImage"), controller.updateProfile);

  router.post("/auth/verify-email", controller.verifyEmail);

  router.post("/auth/forgot-password", controller.forgotPassword);
  
  router.post("/auth/reset-password", controller.validateAndUpdatePassword);
  
  router.post("/auth/change-password", controller.changePassword);

  router.post("/auth/logout", controller.logout);

  router.post("/auth/resend-otp", controller.resendOtp);
};
