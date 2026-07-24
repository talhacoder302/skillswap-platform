const mongoose = require("mongoose");

const Feedback = require(`${__models}/feedback`);
const SwapRequest = require(`${__models}/swapRequest`);
const responseHandler = require(`${__utils}/responseHandler`);
const { feedbackPopulate } = require(`${__utils}/populates`);

exports.submitFeedback = async (req, res) => {
  try {
    const { swapRequestId, rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(swapRequestId)) {
      return responseHandler.validationError(res, "Invalid swap request id.");
    }

    const swapRequest = await SwapRequest.findOne({
      _id: swapRequestId,
      isActive: true,
    });

    if (!swapRequest) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    if (swapRequest.status !== "completed") {
      return responseHandler.validationError(
        res,
        "Feedback can only be submitted for completed swaps.",
      );
    }

    const currentUser = req.user._id.toString();

    const isParticipant =
      swapRequest.requesterId.toString() === currentUser ||
      swapRequest.receiverId.toString() === currentUser;

    if (!isParticipant) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to submit feedback for this swap.",
      );
    }

    const existingFeedback = await Feedback.findOne({
      swapRequestId,
      reviewerId: req.user._id,
    });

    if (existingFeedback) {
      return responseHandler.validationError(
        res,
        "You have already submitted feedback.",
      );
    }

    const revieweeId =
      swapRequest.requesterId.toString() === currentUser
        ? swapRequest.receiverId
        : swapRequest.requesterId;

    const feedback = await Feedback.create({
      swapRequestId,
      reviewerId: req.user._id,
      revieweeId,
      rating,
      review,
    });

    return responseHandler.created(
      res,
      feedback,
      "Feedback submitted successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getReceivedFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      revieweeId: req.user._id,
      isActive: true,
    })
      .populate(feedbackPopulate)
      .select("-isActive -updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return responseHandler.success(
      res,
      feedback,
      "Feedback fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getMyRating = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $match: {
          revieweeId: req.user._id,
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$revieweeId",
          averageRating: {
            $avg: "$rating",
          },
          totalReviews: {
            $sum: 1,
          },
        },
      },
    ]);

    const result =
      stats.length > 0
        ? {
            averageRating: Number(stats[0].averageRating.toFixed(1)),
            totalReviews: stats[0].totalReviews,
          }
        : {
            averageRating: 0,
            totalReviews: 0,
          };

    return responseHandler.success(res, result, "Rating fetched successfully.");
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getGivenFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      reviewerId: req.user._id,
      isActive: true,
    })
      .populate(feedbackPopulate)
      .select("-isActive -updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return responseHandler.success(
      res,
      feedback,
      "Given feedback fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
