const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
      {
            name: {
                  type: String,
                  required: [true, 'Name is required'],
                  minLength: [10, 'Name must have at least 10 characters'],
                  maxLength: [
                        40,
                        'Name must have less or equal than 40 characters',
                  ],
                  trim: true, //remove blank spaces, before and after the content, e.g. "Josue   "
                  // validate: [validator.isAlpha, 'Tour name must only contains characters'],
            },
            duration: {
                  type: Number,
                  required: [true, 'Duration is required'],
            },
            maxGroupSize: {
                  type: Number,
                  required: [true, 'Maximun of group people is required'],
            },
            difficulty: {
                  type: String,
                  required: [true, 'Difficulty is required'], //this is ust a shorthand for the below validation structure
                  enum: {
                        //only for strings
                        values: ['easy', 'medium', 'difficult'], //case sensitive
                        message: 'Dufficulty must be either easy, medium, difficult',
                  },
            },
            ratingsAverage: {
                  type: Number,
                  default: 3.5,
                  min: [0, 'Ratings average must be above 0'],
                  max: [5, 'Ratings average must be below 5'],
                  set: (val) => Math.round(val * 10) / 10, //4.6666, 46.66, 47, 4.7
            },
            ratingsQuantity: {
                  type: Number,
                  default: 0,
            },
            price: {
                  type: Number,
                  required: [true, 'Price is required'],
            },
            priceDiscount: {
                  type: Number,
                  validate: {
                        message: 'Price discount ({VALUE}) must be lower than price',
                        validator: function (value) {
                              //if we do post or patch, we must to include both price and priceDiscount
                              // to this funciton have access both
                              return value < this.price;
                        },
                  },
            },
            summary: {
                  type: String,
                  trim: true,
                  required: [true, 'Sumary is required'],
            },
            description: {
                  type: String,
                  trim: true,
            },
            imageCover: {
                  type: String,
                  // required: [true, 'Image cover is required']
            },
            images: {
                  type: [String],
            },
            startDates: {
                  type: [Date],
                  required: [true, 'Start dates are required'],
            },
            createdAt: {
                  type: Date,
                  default: Date.now(),
                  select: false,
            },
            slug: {
                  type: String,
            },
            secret: {
                  type: Boolean,
                  default: false,
            },
            startLocation: {
                  //GeoJSON
                  type: {
                        type: String,
                        default: 'Point', //could be lines, polygons, etc.
                        enum: ['Point'],
                  },
                  coordinates: [Number], //LONGITUDE, LATITUDE !!!!!!
                  address: String,
                  description: String,
            },
            locations: [
                  {
                        type: {
                              type: String,
                              default: 'Point', //could be lines, polygons, etc.
                              enum: ['Point'],
                        },
                        coordinates: [Number], //LONGITUDE, LATITUDE !!!!!!
                        address: String,
                        description: String,
                        day: Number,
                  },
            ],
            // guides: Array, //for embedded guides
            guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], //in the request, send an array os strings (_id)
      },
      {
            toJSON: { virtuals: true }, //this make virtuals to appear in tour when I do const tour = await Tour.findById(tourId)
            toObject: { virtuals: true }, //this make virtuals to appear in tour in the HTTP response (that is a JSON)
      },
);

//VIRTUAL PROPERTIES (not stored in db)
//here we use a common function and not an arrow function because
//we need to use the this keyword, and it's not in arrow functions
tourSchema.virtual('durationWeeks').get(function (params) {
      return Math.ceil(this.duration / 7);
});

//Virtual populate, call .populate('reviews') only in the get tour, because
//doing it when querying several tours, is too much information that we dont need
tourSchema.virtual('reviews', {
      ref: 'Review',
      foreignField: 'tour', //Name of the field in the other model (Review), where the reference to the current model is stored
      localField: '_id',
});

//Document middleware: runs before .save() and .create(), NOT BEFORE .insertMany()
tourSchema.pre('save', function (next) {
      this.slug = slugify(this.name, { lower: true });
      next(); //good practice to always call at the end
});

//It's for showing how to embedded documents, but in this case is not appropiate
//because every time a user changes, we should look for tours that has this user
//and update it too
// tourSchema.pre('save', async function (next) {
//   //Get the User model for each _id guide in this.guides and put them all in an array
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//     console.log('Will save document')// this is th document being proccessed
//     next(); //good practice to always call at the end
// })

// tourSchema.post('save', function (doc, next) {
//     console.log(doc)
//     next()
// })

//QUERY middleware
//Suppose we want secret tours for a VIP group of users
//THIS WILL NOT work with findById, because behind the scenees, is findOne
// tourSchema.pre('find', function (next) {
//     //this is the query object
//     this.find({ secret: { $ne: true } })
//     next();
// });

//This will execute before every command that begins with find
tourSchema.pre(/^find/, function (next) {
      //this is the query object
      this.find({ secret: { $ne: true } });
      this.start = Date.now();
      next();
});

tourSchema.pre(/^find/, function (next) {
      this.populate({
            path: 'guides',
            select: '-__v -passwordChangedAt',
      });
      //populate wont fail if there is not a guides field
      //Remember popule is making an extra query behind the scene
      next();
});

//after query has executed
//commented to not interfer in distances pipeline (geoNear has to be the first)
// tourSchema.post(/^find/, function (docs, next) {
//   //this is the query object
//   this.find({ secret: { $ne: true } });

//   const now = Date.now();
//   this.start = now - this.start;
//   next();
// });

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next){
//     this.pipeline().unshift({
//         $match: {
//             secret: {
//                 $ne: true
//             }
//         }
//     })
//     next()
// })

//INDEXES
tourSchema.index({ price: 1, ratingsAverage: -1 }); //works for price and ratingsAverage fields separeted too
tourSchema.index({ slug: 1 });
//index for real ponts in the earth sphere
// 2dindex index for fictional points in a 2d plane
tourSchema.index({ startLocation: '2dsphere' });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
