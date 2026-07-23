const jwt = require("jsonwebtoken");
const config = require(`${__config}/config`);

exports.generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

exports.verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

exports.decodeToken = (token) => {
  return jwt.decode(token);
};
