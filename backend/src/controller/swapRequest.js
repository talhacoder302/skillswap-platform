const mongoose = require("mongoose");
const SwapRequest = require(`${__models}/swapRequest`);
const UserSkill = require(`${__models}/userSkill`);
const responseHandler = require(`${__utils}/responseHandler`);
const { swapRequestPopulate } = require(`${__utils}/populates`);
const { findActiveSwapRequest, isRequester, isReceiver } = require(
  `${__services}/swapRequest`,
);
const { createNotification } = require(`${__services}/notification`);
const notificationTypes = require(`${__utils}/notification`);

const getSwapRequests = async (filter) => {
  return await SwapRequest.find(filter)
    .select("-isActive -updatedAt -completedAt")
    .populate(swapRequestPopulate)
    .sort({ createdAt: -1 })
    .lean();
};

exports.sendSwapRequest = async (req, res) => {
  try {
    const { requesterSkillId, receiverSkillId, message } = req.body;

    // Required Fields
    if (!requesterSkillId || !receiverSkillId) {
      return responseHandler.validationError(res, "Both skills are required.");
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(requesterSkillId) ||
      !mongoose.Types.ObjectId.isValid(receiverSkillId)
    ) {
      return responseHandler.validationError(res, "Invalid skill id.");
    }

    // Requester's Skill
    const requesterSkill = await UserSkill.findOne({
      _id: requesterSkillId,
      userId: req.user._id,
      type: "offered",
      isActive: true,
    });

    if (!requesterSkill) {
      return responseHandler.notFound(res, "Your offered skill not found.");
    }

    // Receiver Skill
    const receiverSkill = await UserSkill.findOne({
      _id: receiverSkillId,
      type: "offered",
      isActive: true,
    });

    if (!receiverSkill) {
      return responseHandler.notFound(res, "Receiver skill not found.");
    }

    const receiverWantedSkill = await UserSkill.findOne({
      userId: receiverSkill.userId,
      skillId: requesterSkill.skillId,
      type: "wanted",
      isActive: true,
    });

    if (!receiverWantedSkill) {
      return responseHandler.validationError(
        res,
        "The receiver is not looking for your offered skill.",
      );
    }

    const myWantedSkill = await UserSkill.findOne({
      userId: req.user._id,
      skillId: receiverSkill.skillId,
      type: "wanted",
      isActive: true,
    });

    if (!myWantedSkill) {
      return responseHandler.validationError(
        res,
        "You have not added this skill to your wanted list.",
      );
    }

    // Cannot send request to yourself
    if (receiverSkill.userId.toString() === req.user._id.toString()) {
      return responseHandler.validationError(
        res,
        "You cannot send a swap request to yourself.",
      );
    }

    // Duplicate Pending Request
    const existingRequest = await SwapRequest.findOne({
      requesterId: req.user._id,
      receiverId: receiverSkill.userId,

      requesterSkillId,
      receiverSkillId,

      status: "pending",
      isActive: true,
    });

    if (existingRequest) {
      return responseHandler.validationError(res, "Swap request already sent.");
    }

    // Create Request
    const swapRequest = await SwapRequest.create({
      requesterId: req.user._id,
      receiverId: receiverSkill.userId,

      requesterSkillId,
      receiverSkillId,

      message: message || "",
    });

    await createNotification({
      recipientId: receiverSkill.userId,
      senderId: req.user._id,
      swapRequestId: swapRequest._id,
      type: notificationTypes.SWAP_REQUEST_SENT,
      title: "New Swap Request",
      message: `${req.user.fullName} sent you a swap request.`,
    });

    return responseHandler.created(
      res,
      swapRequest,
      "Swap request sent successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await getSwapRequests({
      receiverId: req.user._id,
      isActive: true,
    });

    return responseHandler.success(
      res,
      requests,
      "Received swap requests fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const requests = await getSwapRequests({
      requesterId: req.user._id,
      isActive: true,
    });

    return responseHandler.success(
      res,
      requests,
      "Sent swap requests fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.acceptSwapRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return responseHandler.validationError(res, "Invalid request id.");
    }

    const swapRequest = await findActiveSwapRequest(requestId);

    if (!swapRequest) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    // Only receiver can accept
    if (swapRequest.receiverId.toString() !== req.user._id.toString()) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to accept this request.",
      );
    }

    // Must be pending
    if (swapRequest.status !== "pending") {
      return responseHandler.validationError(
        res,
        `This request is already ${swapRequest.status}.`,
      );
    }

    swapRequest.status = "accepted";

    await swapRequest.save();

    return responseHandler.success(
      res,
      swapRequest,
      "Swap request accepted successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.rejectSwapRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return responseHandler.validationError(res, "Invalid request id.");
    }

    const swapRequest = await SwapRequest.findOne({
      _id: requestId,
      isActive: true,
    });

    if (!swapRequest) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    // Only receiver can reject
    if (!isReceiver(swapRequest, req.user._id)) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to reject this request.",
      );
    }

    if (swapRequest.status !== "pending") {
      return responseHandler.validationError(
        res,
        `This request is already ${swapRequest.status}.`,
      );
    }

    swapRequest.status = "rejected";

    await swapRequest.save();

    return responseHandler.success(
      res,
      swapRequest,
      "Swap request rejected successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.cancelSwapRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return responseHandler.validationError(res, "Invalid request id.");
    }

    const swapRequest = await SwapRequest.findOne({
      _id: requestId,
      isActive: true,
    });

    if (!swapRequest) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    // Only requester can cancel
    if (!isRequester(swapRequest, req.user._id)) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to cancel this request.",
      );
    }

    if (swapRequest.status !== "pending") {
      return responseHandler.validationError(
        res,
        `This request is already ${swapRequest.status}.`,
      );
    }

    swapRequest.status = "cancelled";

    await swapRequest.save();

    return responseHandler.success(
      res,
      swapRequest,
      "Swap request cancelled successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.completeSwapRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return responseHandler.validationError(res, "Invalid request id.");
    }

    const swapRequest = await SwapRequest.findOne({
      _id: requestId,
      isActive: true,
    });

    if (!swapRequest) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    // Only requester or receiver can complete
    const currentUserId = req.user._id.toString();

    if (
      !isRequester(swapRequest, req.user._id) &&
      !isReceiver(swapRequest, req.user._id)
    ) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to complete this swap.",
      );
    }

    if (swapRequest.status !== "accepted") {
      return responseHandler.validationError(
        res,
        `Only accepted requests can be completed. Current status is '${swapRequest.status}'.`,
      );
    }

    swapRequest.status = "completed";
    swapRequest.completedAt = new Date();

    await swapRequest.save();

    return responseHandler.success(
      res,
      swapRequest,
      "Swap completed successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};

exports.getSwapRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return responseHandler.validationError(res, "Invalid request id.");
    }

    const request = await SwapRequest.findOne({
      _id: requestId,
      isActive: true,
    })
      .populate(swapRequestPopulate)
      .lean();

    if (!request) {
      return responseHandler.notFound(res, "Swap request not found.");
    }

    const currentUser = req.user._id.toString();

    if (
      request.requesterId._id.toString() !== currentUser &&
      request.receiverId._id.toString() !== currentUser
    ) {
      return responseHandler.forbidden(
        res,
        "You are not allowed to view this request.",
      );
    }

    return responseHandler.success(
      res,
      request,
      "Swap request fetched successfully.",
    );
  } catch (error) {
    return responseHandler.error(res, error);
  }
};
