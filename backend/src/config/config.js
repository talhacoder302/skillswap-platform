module.exports = {
  app: {
    name: process.env.APP_NAME || "SkillSwap",
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
    serverUrl: process.env.SERVER_URL || "http://localhost:5000",
  },

  database: {
    uri: process.env.MONGO_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};
