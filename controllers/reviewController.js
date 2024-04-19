const Review = require('../models/reviewModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const createAsync = require('../utils/catchAsync');
const handlerFactory = require('../common/handlerFactory');

const getAllReviews = handlerFactory.getAllDocuments(Review);

const postReview = handlerFactory.createDocument(Review);

const patchReview = handlerFactory.updateDocument(Review);

const deleteReview = handlerFactory.deleteDocument(Review);

const setTourUserIds = (req, res, next) => {
      if (!req.body.tour) req.body.tour = req.params.tourId;
      if (!req.body.user) req.body.user = req.user.id;
      next();
};

const validateClient = createAsync(async (req, res, next) => {
      const reviewId = req.params.id;

      const review = await Review.findById(reviewId);
      if (!review) {
            return next(new AppError('Review not found', 404));
      }

      if (review?.user?._id.toString() !== req.user.id) {
            return next(
                  new AppError(
                        'You are not allowed to manipulate this review',
                        401,
                  ),
            );
      }
      next();
});

const setTourId = async (req, res, next) => {
      next();
};

module.exports = {
      postReview,
      getAllReviews,
      patchReview,
      setTourUserIds,
      deleteReview,
      validateClient,
      setTourId,
};
