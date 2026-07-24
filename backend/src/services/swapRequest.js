const mongoose = require("mongoose");
const SwapRequest = require(`${__models}/swapRequest`);

const findActiveSwapRequest = async (requestId) => {
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return null;
  }

  return await SwapRequest.findOne({
    _id: requestId,
    isActive: true,
  });
};

const isRequester = (swapRequest, userId) => {
  return swapRequest.requesterId.toString() === userId.toString();
};

const isReceiver = (swapRequest, userId) => {
  return swapRequest.receiverId.toString() === userId.toString();
};

module.exports = {
  findActiveSwapRequest,
  isRequester,
  isReceiver,
};
