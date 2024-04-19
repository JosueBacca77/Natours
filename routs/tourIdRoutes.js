const express = require('express');
const {
  getTour,
  patchTour,
  putTour,
  deleteTour,
  resizeTourImages,
  uploadTourImages,
} = require('../controllers/tourController');
const { getTourImages } = require('../controllers/tourIdController');
const { protect, restrictTo } = require('../controllers/authController');
const { reviewRoutes } = require('./reviewRoutes');

const tourIdRoutes = express.Router({ mergeParams: true });

tourIdRoutes
  .route('/')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    patchTour,
  )
  .put(protect, restrictTo('admin', 'lead-guide'), putTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

tourIdRoutes.route('/images').get(getTourImages);

tourIdRoutes.use('/reviews', reviewRoutes);

module.exports = {
  tourIdRoutes,
};
