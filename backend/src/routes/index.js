const express = require("express");

const authController = require(`${__controller}/auth`);
const skillController = require(`${__controller}/skill`);
const categoryController = require(`${__controller}/category`);
const userSkillController = require(`${__controller}/userSkill`);
const swapRequestController = require(`${__controller}/swapRequest`);
const notificationController = require(`${__controller}/notification`);
const feedbackController = require(`${__controller}/feedback`);
const dashboardController = require(`${__controller}/dashboard`);
const chatController = require(`${__controller}/chat`);

const router = express.Router();

require(`${__routes}/auth`)(router, authController);
require(`${__routes}/skill`)(router, skillController);
require(`${__routes}/category`)(router, categoryController);
require(`${__routes}/userSkill`)(router, userSkillController);
require(`${__routes}/swapRequest`)(router, swapRequestController);
require(`${__routes}/notification`)(router, notificationController);
require(`${__routes}/dashboard`)(router, dashboardController);
require(`${__routes}/chat`)(router, chatController);

module.exports = router;
