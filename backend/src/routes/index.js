const express = require("express");

const authController = require(`${__controller}/auth`);

const router = express.Router();

require(`${__routes}/auth`)(router, authController);

module.exports = router;
