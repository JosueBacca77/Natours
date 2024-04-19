const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: `${__dirname}/../../config.env` });
const fs = require('fs');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const DB = process.env.DATABASE.replace(
      '<PASSWORD>',
      process.env.DATABASE_PASSWORD,
);

let errorTours = [];
let errorUsers = [];
let errorReviews = [];

// Read JSON file
//__dirname is the path to the foler of the current executing file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
      fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

const executeToursCreation = async () => {
      let createdToursCount = 0;

      for (const tour of tours) {
            const tourId = tour._id;

            try {
                  const tourCreated = await Tour.create(tour);

                  createdToursCount = ++createdToursCount;
            } catch (err) {
                  console.log(
                        `Error creating tour with id ${tourId}`,
                        err.message,
                  );
                  errorTours.push(tourId);
            }
      }

      if (errorTours.length > 0) {
            console.log(`Creation of tours with ${errorTours.length} errors:`);
            console.log("Tour's IDs with errors: ");
            errorTours.forEach((id) => {
                  console.log(id);
            });
      }

      if (createdToursCount) {
            console.log(`${createdToursCount} new tours have been loaded!`);
      }
};

const executeUsersCreation = async () => {
      let createdUsersCount = 0;

      for (const user of users) {
            const userId = user._id;

            try {
                  const userCreated = await User.create(user, {
                        validateBeforeSave: false,
                  });

                  console.log(`NEW USER LOADED ${userCreated._id}`);

                  createdUsersCount = ++createdUsersCount;
            } catch (err) {
                  console.log(
                        `Error creating user with id ${userId}`,
                        err.message,
                  );
                  errorUsers.push(userId);
            }
      }

      if (errorUsers.length > 0) {
            console.log(`Creation of users with ${errorUsers.length} errors:`);
            console.log("User's IDs with errors: ");
            errorUsers.forEach((id) => {
                  console.log(id);
            });
      }

      if (createdUsersCount) {
            console.log(`${createdUsersCount} new users have been loaded!`);
      }
};

const executeReviewsCreation = async () => {
      let createdReviewsCount = 0;

      for (const review of reviews) {
            const reviewId = review._id;

            try {
                  const reviewCreated = await Review.create(review);

                  console.log(`NEW REVIEW LOADED ${reviewCreated._id}`);

                  createdReviewsCount = ++createdReviewsCount;
            } catch (err) {
                  console.log(
                        `Error creating review with id ${reviewId}`,
                        err.message,
                  );
                  errorReviews.push(reviewId);
            }
      }

      if (errorReviews.length > 0) {
            console.log(
                  `Creation of reviews with ${errorReviews.length} errors:`,
            );
            console.log("Review's IDs with errors: ");
            errorReviews.forEach((id) => {
                  console.log(id);
            });
      }

      if (createdReviewsCount) {
            console.log(`${createdReviewsCount} new reviews have been loaded!`);
      }
};

const deleteData = async () => {
      try {
            //Tours
            const respTours = await Tour.deleteMany();
            if (respTours?.n === 0) {
                  console.log('No tours to delete!');
            } else {
                  console.log('Tours successfully deleted!');
            }

            //Users
            const respUsers = await User.deleteMany();
            if (respUsers?.n === 0) {
                  console.log('No users to delete!');
            } else {
                  console.log('Users successfully deleted!');
            }

            //Reviews
            const respReviews = await Review.deleteMany();
            if (respReviews?.n === 0) {
                  console.log('No reviews to delete!');
            } else {
                  console.log('Reviews successfully deleted!');
            }

            process.exit();
      } catch (err) {
            console.log(err);
            process.exit();
      }
};

mongoose
      .connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
      })
      .then(async (connection) => {
            console.log('DB connection successful!');

            if (process.argv[2] === '--import') {
                  await executeToursCreation();
                  // await executeUsersCreation();
                  await User.create(users, { validateBeforeSave: false }); //WHY THIS WORKS and not with one docuemnt
                  await executeReviewsCreation();
                  process.exit();
            } else if (process.argv[2] === '--delete') {
                  deleteData();
            }
      })
      .catch((error) => {
            console.error('DB connection error:', error);
      });
