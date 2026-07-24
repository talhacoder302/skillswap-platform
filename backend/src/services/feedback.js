const getRatingSummary = async (userId) => {
  const stats = await Feedback.aggregate([
    {
      $match: {
        revieweeId: userId,
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$revieweeId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return stats.length
    ? {
        averageRating: Number(stats[0].averageRating.toFixed(1)),
        totalReviews: stats[0].totalReviews,
      }
    : {
        averageRating: 0,
        totalReviews: 0,
      };
};

module.exports = {
  getRatingSummary,
};
