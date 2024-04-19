const express = require('express');
const {
  getAllTours,
  postTour,
  getTop5CheapestTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tourController');
const { tourIdRoutes } = require('./tourIdRoutes');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(getAllTours)
  //We could call the catchAsync here like this:
  //.get(catchAsync(getAllTours))
  //but the problem with this is that we would have to remember which handlers
  //are asyncronous functions, in these examples all of them are so, but there are
  //cases where there are not
  .post(protect, restrictTo('admin'), postTour);

router.route('/top-5-cheapest-tours').get(getTop5CheapestTours, getAllTours);

router.route('/stats').get(getTourStats);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.use('/:id', tourIdRoutes);

module.exports = router;
