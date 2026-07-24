const UserSkill = require(`${__models}/userSkill`);
const SwapRequest = require(`${__models}/swapRequest`);
const Notification = require(`${__models}/notification`);
const Feedback = require(`${__models}/feedback`);
const responseHandler = require(`${__utils}/responseHandler`);
const { getRecentActivity } = require(`${__services}/dashboard`);
const User = require(`${__models}/user`);
const Skill = require(`${__models}/skill`);
const SkillCategory = require(`${__models}/skillCategory`);

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      offeredSkills,
      wantedSkills,
      pendingRequests,
      acceptedSwaps,
      completedSwaps,
      unreadNotifications,
      ratingStats,
    ] = await Promise.all([
      UserSkill.countDocuments({
        userId,
        type: "offered",
        isActive: true,
      }),

      UserSkill.countDocuments({
        userId,
        type: "wanted",
        isActive: true,
      }),

      SwapRequest.countDocuments({
        receiverId: userId,
        status: "pending",
        isActive: true,
      }),

      SwapRequest.countDocuments({
        $or: [{ requesterId: userId }, { receiverId: userId }],
        status: "accepted",
        isActive: true,
      }),

      SwapRequest.countDocuments({
        $or: [{ requesterId: userId }, { receiverId: userId }],
        status: "completed",
        isActive: true,
      }),

      Notification.countDocuments({
        recipientId: userId,
        isRead: false,
        isActive: true,
      }),

      Feedback.aggregate([
        {
          $match: {
            revieweeId: userId,
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const rating =
      ratingStats.length > 0
        ? {
            averageRating: Number(ratingStats[0].averageRating.toFixed(1)),
            totalReviews: ratingStats[0].totalReviews,
          }
        : {
            averageRating: 0,
            totalReviews: 0,
          };

    return responseHandler.success(
      res,
      {
        offeredSkills,
        wantedSkills,
        pendingRequests,
        acceptedSwaps,
        completedSwaps,
        unreadNotifications,
        ...rating,
      },
      "Dashboard statistics fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const activity = await getRecentActivity(req.user._id);

    return responseHandler.success(
      res,
      activity,
      "Recent activity fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSkills,
      totalCategories,
      totalUserSkills,
      totalSwapRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests,
      totalNotifications,
      totalFeedback,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),

      Skill.countDocuments({ isActive: true }),

      SkillCategory.countDocuments({ isActive: true }),

      UserSkill.countDocuments({ isActive: true }),

      SwapRequest.countDocuments({ isActive: true }),

      SwapRequest.countDocuments({
        status: "pending",
        isActive: true,
      }),

      SwapRequest.countDocuments({
        status: "accepted",
        isActive: true,
      }),

      SwapRequest.countDocuments({
        status: "completed",
        isActive: true,
      }),

      Notification.countDocuments({
        isActive: true,
      }),

      Feedback.countDocuments({
        isActive: true,
      }),
    ]);

    return responseHandler.success(
      res,
      {
        totalUsers,
        totalSkills,
        totalCategories,
        totalUserSkills,
        totalSwapRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        totalNotifications,
        totalFeedback,
      },
      "Admin dashboard statistics fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
