const Notification = require(`${__models}/notification`);

const createNotification = async ({
  recipientId,
  senderId,
  swapRequestId = null,
  type,
  title,
  message,
}) => {
  return await Notification.create({
    recipientId,
    senderId,
    swapRequestId,
    type,
    title,
    message,
  });
};

// const getUserNotifications = async (userId) => {
//   return Notification.find({
//     recipientId: userId,
//     isActive: true,
//   })
//     .populate(notificationPopulate)
//     .select("-isActive -updatedAt")
//     .sort({ createdAt: -1 })
//     .lean();
// };

module.exports = {
  createNotification,
  //   getUserNotifications,
};
