const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating can not be empty!'],
      //If we do Match.round(4.666) it's gonna be 4.67 and we want 4.7
      set: (val) => Math.round(val * 10) / 10, //4.6666, 46.66, 47, 4.7
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true }, //this make virtuals to appear in tour when I do const tour = await Tour.findById(tourId)
    toObject: { virtuals: true }, //this make virtuals to appear in tour in the HTTP response (that is a JSON)
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  //   .populate({
  //     path: 'tour',
  //     select: 'name',
  //   }); //it would be create a chain of populates
  //populate wont fail if there is not a guides field
  //Remember popule is making an extra query behind the scene
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 3.5,
      ratingsQuantity: 0,
    });
  }
};

//We have to use POST save because at this point in time the tour is not yet saved
//so when we make the aggregte in the static method above, the match won't
//have the review we are saving in consideration because it doesnt exist yet
reviewSchema.post('save', function () {
  //this points to the document
  //We can not do Review.calcAverageRatings(this.tour); because Review is not defined yet
  this.constructor.calcAverageRatings(this.tour);
  //Thats why calcAverageRatings is a static method, because we have to use
  //the constructor of the current document which was saved
});

//REMEMBER !!
//findByIdAndUpdate it's just a shorthand for findOneAndUpdate
//findByIdAndDelete it's just a shorthand for findOneAndDelete

//IMPORTANT
//In order to calculate the average rating of a tour after a rview is updated or removed
//we use the pre query middleware findByAnd (..update or ..delete) get the document
//using this.findOne() to access to the review, and pass this document into the rev variable to the next middleware,
//the post findOoneAnd.. and here the review was already updated, and with the document passed in rev to acces to the constructor,
//and with this, to the calcAverageRatings

//Query middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  const reviewDocument = await this.findOne();
  this.rev = reviewDocument;
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //this.findOne() doesnt work here because query was already executed
  this.rev.constructor.calcAverageRatings(this.rev.tour);
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
