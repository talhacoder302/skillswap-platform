module.exports = (router, controller) => {
  router.post("/auth/register", controller.register);

  router.post("/auth/login", controller.login);

  router.post("/auth/verify-email", controller.verifyEmail);

  router.post("/auth/resend-otp", controller.resendOtp);

  router.post("/auth/forgot-password", controller.forgotPassword);

  router.post("/auth/reset-password", controller.resetPassword);

  router.get("/auth/me", controller.me);

  router.post("/auth/logout", controller.logout);
};
