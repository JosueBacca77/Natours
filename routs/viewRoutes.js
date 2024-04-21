const express = require("express");
const {
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
  getMyTours,
  getOverview,
  alerts,
} = require("../controllers//viewController");
const { protect, isLoggedIn } = require("../controllers/authController");

const viewRouter = express.Router();

viewRouter.use(alerts);

viewRouter.get("/", isLoggedIn, getOverview);

viewRouter.get("/tour/:slug", isLoggedIn, getTour);

viewRouter.get("/login", isLoggedIn, getLoginForm);

viewRouter.get("/me", protect, getAccount);

viewRouter.post("/submit-user-data", protect, updateUserData);

viewRouter.get("/my-tours", protect, getMyTours);

module.exports = viewRouter;
