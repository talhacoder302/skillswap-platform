const Notification = require(`${__models}/notification`);
const responseHandler = require(`${__utils}/responseHandler`);
const { notificationPopulate } = require(`${__utils}/populates`);
const mongoose = require("mongoose");

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user._id,
      isActive: true,
    })
      .populate(notificationPopulate)
      .select("-isActive -updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return responseHandler.success(
      res,
      notifications,
      "Notifications fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return responseHandler.validationError(res, "Invalid notification id.");
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: req.user._id,
      isActive: true,
    });

    if (!notification) {
      return responseHandler.notFound(res, "Notification not found.");
    }

    notification.isRead = true;

    await notification.save();

    return responseHandler.success(
      res,
      notification,
      "Notification marked as read.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false,
      isActive: true,
    });

    return responseHandler.success(
      res,
      {
        unreadCount,
      },
      "Unread notification count fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
