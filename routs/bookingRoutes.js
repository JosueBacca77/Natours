const { protect, restrictTo } = require('../controllers/authController');
const express = require('express');
const {
      getCheckoutSession,
      getBooking,
      putBooking,
      patchBooking,
      deleteBooking,
      getAllBookings,
      createBooking,
} = require('../controllers/bookingController');
require('../controllers/reviewController');

const bookingRoutes = express.Router();

bookingRoutes.use(protect);

bookingRoutes.get('/checkout-session/:tourId', getCheckoutSession);

bookingRoutes.use(restrictTo('admin', 'lead-guide'));

bookingRoutes.route('/').get(getAllBookings).post(createBooking);

bookingRoutes
      .route('/:id')
      .get(getBooking)
      .put(putBooking)
      .patch(patchBooking)
      .delete(deleteBooking);

module.exports = {
      bookingRoutes,
};
