const User = require('../models/userModel');
const AppError = require('../utils/appError');
const createAsync = require('../utils/catchAsync');
const { filterObject } = require('../utils/common');
const handlerFactory = require('../common/handlerFactory');
const multer = require('multer');
//TODO: make sharp work
// const sharp = require('sharp');

const multerStorage = multer.diskStorage({
      destination: function (req, file, cb) {
            //cb is like next, but it's for clipboard
            cb(null, 'public/img/users');
      },
      filename: function (req, file, cb) {
            // user-857h5h5m4545-rd54546ytr.jpeg
            const extension = file.mimetype.split('/')[1];
            cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
      },
});
//Using sharp
// const multerStorage = multer.memoryStorage();

const multerFilter = function (req, file, cb) {
      if (file.mimetype.startsWith('image')) {
            cb(null, true);
      } else {
            cb(
                  new AppError('Not an image! Please upload only images', 400),
                  false,
            );
      }
};

const upload = multer({
      storage: multerStorage,
      fileFilter: multerFilter,
});

const getAllUsers = handlerFactory.getAllDocuments(User);

const updateMe = createAsync(async (req, res, next) => {
      const body = req.body;

      //1) Check if user POSTed password data
      if (body.password || body.passwordConfirm) {
            return next(
                  new AppError(
                        'This route is not for password updates. Please use /update-password',
                        400,
                  ),
            );
      }

      //2) Filtered out unwanted fields names that are not allowed to be updated

      // We shouldn't pass req.body to findByIdAndUpdate because
      //user could update role, token, tokesExpires etc
      const filteredBody = filterObject(req.body, 'name', 'email');
      if (req.file) filteredBody.photo = req.file.filename;

      //3) Update user document

      //We shouldnt use user.save() because it will run validators
      //such as password, passwordConfirm, etc
      const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            filteredBody,
            {
                  new: true,
                  runValidators: true,
            },
      );

      res.status(200).send({
            status: 'success',
            data: {
                  user: updatedUser,
            },
      });
});

const getUser = handlerFactory.getDocument(User);

const postUser = () => {};

const patchUser = () => {};

const deleteUser = handlerFactory.deleteDocument(User);

const deleteMe = createAsync(async (req, res, next) => {
      await User.findByIdAndUpdate(
            req.user.id,
            {
                  active: false,
            },
            {
                  new: true,
                  runValidators: true,
            },
      );

      res.status(204).json({
            status: 'success',
      });
});

const getMe = createAsync(async (req, res, next) => {
      req.params.id = req.user.id;
      next();
});

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = createAsync(async (req, res, next) => {
      // if (!req.file) return next();

      // req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

      //Keep the image in memory
      // await sharp(req.file.buffer)
      //   .resize(500, 500)
      //   .toFormat('jpeg')
      //   .jpeg({ quality: 90 })
      //   .toFile(`public/img/users/${req.file.filename}`);

      next();
});

module.exports = {
      getAllUsers,
      getUser,
      postUser,
      patchUser,
      deleteUser,
      deleteMe,
      updateMe,
      getMe,
      uploadUserPhoto,
      resizeUserPhoto,
};
