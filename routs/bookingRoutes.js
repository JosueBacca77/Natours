const { protect, restrictTo } = require("../controllers/authController");
const express = require("express");
const {
  getCheckoutSession,
  getBooking,
  putBooking,
  patchBooking,
  deleteBooking,
  getAllBookings,
  createBooking,
  webhookBookingCheckout,
} = require("../controllers/bookingController");
require("../controllers/reviewController");

const bookingRoutes = express.Router();

bookingRoutes.post("/create-booking-checkout", webhookBookingCheckout);

bookingRoutes.use(protect);

bookingRoutes.get("/checkout-session/:tourId", getCheckoutSession);

bookingRoutes.use(restrictTo("admin", "lead-guide"));

bookingRoutes.route("/").get(getAllBookings).post(createBooking);

bookingRoutes
  .route("/:")
  .get(getBooking)
  .put(putBooking)
  .patch(patchBooking)
  .delete(deleteBooking);

module.exports = {
  bookingRoutes,
};
