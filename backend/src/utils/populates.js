const swapRequestPopulate = [
  {
    path: "requesterId",
    select: "fullName email profilePicture",
  },
  {
    path: "receiverId",
    select: "fullName email profilePicture",
  },
  {
    path: "requesterSkillId",
    select: "type proficiency description",
    populate: {
      path: "skillId",
      select: "name slug categoryId",
      populate: {
        path: "categoryId",
        select: "name",
      },
    },
  },
  {
    path: "receiverSkillId",
    select: "type proficiency description",
    populate: {
      path: "skillId",
      select: "name slug categoryId",
      populate: {
        path: "categoryId",
        select: "name",
      },
    },
  },
];

module.exports = {
  swapRequestPopulate,
};
