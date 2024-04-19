const { protect, restrictTo } = require('../controllers/authController');
const { celebrate } = require('celebrate');
const { reviewSchema } = require('../controllers/schemas/review');
const express = require('express');
const {
  postReview,
  getAllReviews,
  patchReview,
  setTourUserIds,
  deleteReview,
  validateClient,
  setTourId,
} = require('../controllers/reviewController');

//We set merge params in true because by default each route
//has access to their specific route params. In this case the route (/)
//does not have access to the tourId param that we define in tourRutes.
const reviewRoutes = express.Router({ mergeParams: true });

reviewRoutes.use(protect);

reviewRoutes.use(setTourId);

reviewRoutes
  .route('/')
  .get(getAllReviews)
  .post(
    restrictTo('client'),
    celebrate({ body: reviewSchema }),
    setTourUserIds,
    postReview,
  );

reviewRoutes
  .route('/:id')
  .patch(restrictTo('client'), validateClient, setTourUserIds, patchReview)
  .delete(restrictTo('client'), validateClient, setTourUserIds, deleteReview);

module.exports = {
  reviewRoutes,
};
