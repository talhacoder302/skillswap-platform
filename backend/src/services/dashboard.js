const SwapRequest = require(`${__models}/swapRequest`);
const Notification = require(`${__models}/notification`);
const Feedback = require(`${__models}/feedback`);

const { swapRequestPopulate, notificationPopulate, feedbackPopulate } = require(
  `${__utils}/populates`,
);

const getRecentActivity = async (userId) => {
  const [recentSwaps, recentNotifications, recentFeedback] = await Promise.all([
    SwapRequest.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      isActive: true,
    })
      .populate(swapRequestPopulate)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    Notification.find({
      recipientId: userId,
      isActive: true,
    })
      .populate(notificationPopulate)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    Feedback.find({
      revieweeId: userId,
      isActive: true,
    })
      .populate(feedbackPopulate)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    recentSwaps,
    recentNotifications,
    recentFeedback,
  };
};

module.exports = {
  getRecentActivity,
};
