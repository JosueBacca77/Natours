const Tour = require('../models/tourModel');
const createAsync = require('../utils/catchAsync');
const handlerFactory = require('../common/handlerFactory');
const multer = require('multer');

// //IMPORTANT: whenever we call next(smth), the global error handler (below) will be executed
// next(error)

const getTourFileImageName = (tourId, file) => {
  const extension = file.mimetype.split('/')[1];
  if (file.fieldname === 'imageCover') {
    return `tour-${tourId}-${Date.now()}-cover.${extension}`;
  }
  if (file.fieldname === 'images') {
    return `tour-${tourId}-${Date.now()}.${extension}`;
  }
  return file.originalname;
};
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    //cb is like next, but it's for clipboard
    cb(null, 'public/img/tours');
  },
  filename: function (req, file, cb) {
    // user-857h5h5m4545-rd54546ytr.jpeg
    cb(null, getTourFileImageName(req.params.id, file));
  },
});
//Using sharp
// const multerStorage = multer.memoryStorage();

const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
const getTop5CheapestTours = async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = 'price, name';
  req.query.fields = 'name, price, difficulty, duration';
  next();
};

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

const resizeTourImages = createAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //USING SHARP STORAGE
  // req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  // await sharp(req.files.imageCover[0].buffer)
  //   .resize(2000, 1333)
  //   .toFormat('jpeg')
  //   .toFile(`public/img/tours/${req.body.imageCover}`);
  // req.body.images = [];
  // await Promise.all(
  //   req.files.images.map(async (file, i) => { //MAP RETURNS A PROMISE! THAT'S WHY WE USE IT
  //     const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
  //     await sharp(file.buffer)
  //       .resize(2000, 1333)
  //       .toFormat('jpeg')
  //       .toFile(`public/img/tours/${filename}`);
  //     req.body.images.push(filename);
  //   }),
  // );

  //USING MULTERSTORAGE
  req.body.imageCover = req.files.imageCover[0].filename;
  req.body.images = [];
  req.files.images.map((file) => req.body.images.push(file.filename));

  next();
});

const getAllTours = handlerFactory.getAllDocuments(Tour);

const getTour = handlerFactory.getDocument(Tour, {
  path: 'reviews',
  select: '-__v -_id',
});

const patchTour = handlerFactory.updateDocument(Tour);

const putTour = handlerFactory.replaceDocument(Tour);

const postTour = handlerFactory.createDocument(Tour);

const deleteTour = handlerFactory.deleteDocument(Tour);

const getTourStats = createAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    // {
    //     $match: {
    //         ratingsAverage: {
    //             $gte: 1
    //         }
    //     }
    // },
    {
      $group: {
        // _id: null, //calculate data from every tour, not by groups
        // _id: '$price',
        _id: { $toUpper: '$difficulty' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        totalPrice: { $sum: '$price' },
        toursCount: { $count: {} },
      },
    },
    {
      $sort: {
        //at this point we only have the fields specified in group stage
        toursCount: -1,
        avgRating: -1,
        // avgPrice: -1
      },
    },
    // { //we can repeat stages
    //     $match: {
    //         _id: {
    //             $ne: 'EASY'
    //             // $not: {
    //             //     $regex: '^EASY$', // ^ and $ ensure an exact match
    //             //     $options: 'i'    // 'i' for case-insensitive
    //             // }
    //         }
    //     }
    // }
  ]);

  res.status(200).send({
    status: 'success',
    data: {
      stats: stats,
    },
  });
});

//calculate how many tours are in every month, for a given year
const getMonthlyPlan = createAsync(async (req, res) => {
  const year = req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        numTourStarts: {
          $count: {}, // or $sum: 1
        },
        tours: {
          $push: {
            name: '$name',
            price: '$price',
            ratingAvg: '$ratingsAverage',
          },
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12, //to keep as a reference
    },
  ]);

  res.status(200).send({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi

const getToursWithin = createAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!distance) {
    next(
      new AppError(
        'Please provide distance in the format /tours-within/:distance/center/:latlng/unit/:unit',
        400,
      ),
    );
  }

  if (!unit) {
    next(
      new AppError(
        'Please provide unit in the format /tours-within/:distance/center/:latlng/unit/:unit',
        400,
      ),
    );
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //we need radius in radians

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

const getDistances = createAsync(async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      //geoNeat always need to be the first stage
      //needs a 2dsphere index, if you only one field with
      //this index, geoNear will automatically take this field
      //if you ahve multiple fields with the index, you have to
      //specify what you want to use
      //in this cae we only have startLocation, so it's will be used
      $geoNear: {
        near: {
          //pont from where we will calculate distances
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', //choose the name of the field
        distanceMultiplier: multiplier, //by default ths number is in meters
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

module.exports = {
  getAllTours,
  getTour,
  postTour,
  patchTour,
  putTour,
  deleteTour,
  getTop5CheapestTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
};
