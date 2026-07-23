const express = require("express");

const authController = require(`${__controller}/auth`);
const skillController = require(`${__controller}/skill`);
const categoryController = require(`${__controller}/category`);

const router = express.Router();

require(`${__routes}/auth`)(router, authController);
require(`${__routes}/skill`)(router, skillController);
require(`${__routes}/category`)(router, categoryController);

module.exports = router;
