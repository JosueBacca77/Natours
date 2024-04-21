const express = require("express");
const { webhookBookingCheckout } = require("../controllers/bookingController");

const webhooksRoutes = express.Router();

webhooksRoutes.post(
  "/create-booking-checkout",
  express.raw({ type: "application/json" }),
  webhookBookingCheckout
);

module.exports = {
  webhooksRoutes,
};
