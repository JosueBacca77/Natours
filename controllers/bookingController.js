const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const createAsync = require("../utils/catchAsync");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const handlerFactory = require("../common/handlerFactory");
const User = require("../models/userModel");

const getCheckoutSession = createAsync(async (req, res, next) => {
  const tourId = req?.params?.tourId;

  if (!tourId) {
    return next(new AppError("No tour id provided", 400));
  }

  //1) Get the currently booked tour

  const tour = await Tour.findById(tourId);

  // 2) Create checkout session

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/my-tours`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: "payment", // Specify the mode as 'payment' for one-time payments
    line_items: [
      {
        // name: `${tour.name} Tour`,
        // description: tour.summary,
        // images: [
        //       `https://www.natours.dev/img/tours/${tour.imageCover}`,
        // ], //images online, stripe wiil access to them through internet
        // amount: tour.price * 100, //amoutn expected to be in cents
        // currency: 'usd',
        quantity: 1,
        price_data: {
          unit_amount: tour.price * 100,
          currency: "usd",
          product_data: {
            name: tour.name,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`,
            ],
          },
        },
        // price: tour.price * 100,
      },
    ],
  });
  // 3) Create session as response
  res.status(200).send({
    status: "success",
    session,
  });
});

const createBookingCheckout = createAsync(async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_details.email }))
    .id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
});

const webhookBookingCheckout = createAsync(async (req, res, next) => {
  const stripeSignatrue = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      stripeSignatrue,
      process.env.WEBHOOK_CHECKOUT_BOOKING_SECRET
    );
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type !== "checkout.session.completed") {
    response
      .status(400)
      .send(
        `Webhook Error: event for this endpoint should be checkout.session.completed`
      );
  }
  await createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
});

const createBooking = handlerFactory.createDocument(Booking);

const getBooking = handlerFactory.getDocument(Booking);

const getAllBookings = handlerFactory.getAllDocuments(Booking);

const patchBooking = handlerFactory.updateDocument(Booking);

const putBooking = handlerFactory.replaceDocument(Booking);

const deleteBooking = handlerFactory.deleteDocument(Booking);

module.exports = {
  getCheckoutSession,
  webhookBookingCheckout,
  createBooking,
  getAllBookings,
  getBooking,
  patchBooking,
  putBooking,
  deleteBooking,
};
