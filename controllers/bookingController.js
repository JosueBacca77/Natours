const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const createAsync = require('../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const handlerFactory = require('../common/handlerFactory');

const getCheckoutSession = createAsync(async (req, res, next) => {
      const tourId = req?.params?.tourId;

      if (!tourId) {
            return next(new AppError('No tour id provided', 400));
      }

      //1) Get the currently booked tour

      const tour = await Tour.findById(tourId);

      // 2) Create checkout session

      const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            //THIS IS NOT SECURE, it's a work around to avoid make it longer, anyone could write
            //these params in the url and create a new booking without paying
            success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${req.user.id}&price=${tour.price}`,
            // success_url: `${req.protocol}://${req.get('host')}/`,
            cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
            customer_email: req.user.email,
            client_reference_id: req.params.tourId,
            mode: 'payment', // Specify the mode as 'payment' for one-time payments
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
                              currency: 'usd',
                              product_data: {
                                    name: tour.name,
                                    description: tour.summary,
                                    images: [
                                          `https://www.natours.dev/img/tours/${tour.imageCover}`,
                                    ],
                              },
                        },
                        // price: tour.price * 100,
                  },
            ],
      });
      // 3) Create session as response
      res.status(200).send({
            status: 'success',
            session,
      });
});

const createBookingCheckout = createAsync(async (req, res, next) => {
      //This is only temporary, because it's unsecure
      const { tour, user, price } = req.query;

      if (!tour || !user || !price) return next();

      await Booking.create({ tour, user, price });

      res.redirect(req.originalUrl.split('?')[0]);

      next();
});

const createBooking = handlerFactory.createDocument(Booking);

const getBooking = handlerFactory.getDocument(Booking);

const getAllBookings = handlerFactory.getAllDocuments(Booking);

const patchBooking = handlerFactory.updateDocument(Booking);

const putBooking = handlerFactory.replaceDocument(Booking);

const deleteBooking = handlerFactory.deleteDocument(Booking);

module.exports = {
      getCheckoutSession,
      createBookingCheckout,
      createBooking,
      getAllBookings,
      getBooking,
      patchBooking,
      putBooking,
      deleteBooking,
};
