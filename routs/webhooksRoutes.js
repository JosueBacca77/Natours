const express = require("express");
const { createBookingCheckout } = require("../controllers/bookingController");

const webhooksRoutes = express.Router();

webhooksRoutes.post(
  "/create-booking-checkout",
  express.raw({ type: "application/json" }),
  createBookingCheckout
);

module.exports = {
  webhooksRoutes,
};
