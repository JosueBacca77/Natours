const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const createAsync = require("../utils/catchAsync");

const BOOKING_ALERT = "booking";
const BOOKING_ALERT_MESSAGE =
  "Your booking is successful. Please check your email for further instructions. If your booking doesn't show up here immediately, please come back later.";

const getOverview = createAsync(async (req, res, next) => {
  //1) Get tour data from collection
  const tours = await Tour.find();

  //2) Build template
  //3) Render template using tour data from 1)

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

const getTour = createAsync(async (req, res, next) => {
  //1) Get the data, for the requested tour (including reviews and guides)
  const tourSlug = req.params.slug;

  const tour = await Tour.findOne({ slug: tourSlug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) return next(new AppError("There is no tour with that name", 404));

  //2) Build template
  //3) Render template using tour data from 1)
  res.status(200).render("tour", {
    title: tour.name,
    tour,
  });
});

const getLoginForm = createAsync(async (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
});

const getAccount = createAsync(async (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
});

const updateUserData = createAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      //remember we never should use findByIdAndUpdate for updateing passwords
      //we have another controller for that
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});

const getMyTours = createAsync(async (req, res, next) => {
  const userId = req.user.id;

  //1) Find all bookings
  const bookings = await Booking.find({ user: userId });

  //2) Find tours with the returned IDs

  //We could use populate in schema instead of this
  const toursIds = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: toursIds } });

  return res.status(200).render("overview", {
    title: "My tours",
    tours,
  });
});

const alerts = createAsync(async (req, res, next) => {
  const { alert } = req.query;

  if (alert === BOOKING_ALERT) {
    res.locals.alert = BOOKING_ALERT_MESSAGE;
  }
  next();
});

module.exports = {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
  getMyTours,
  alerts,
};
