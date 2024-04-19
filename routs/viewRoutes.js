const express = require('express');
const {
      getOverview,
      getTour,
      getLoginForm,
      getAccount,
      updateUserData,
      getMyTours,
} = require('../controllers//viewController');
const { protect, isLoggedIn } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

const viewRouter = express.Router();

//WORK AROUND FOR CREATING BOOKING, dont to use createBookingCheckout here
viewRouter.get('/', createBookingCheckout, isLoggedIn, getOverview);

viewRouter.get('/tour/:slug', isLoggedIn, getTour);

viewRouter.get('/login', isLoggedIn, getLoginForm);

viewRouter.get('/me', protect, getAccount);

viewRouter.post('/submit-user-data', protect, updateUserData);

viewRouter.get('/my-tours', protect, getMyTours);

module.exports = viewRouter;
