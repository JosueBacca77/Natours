const express = require('express');
const { celebrate } = require('celebrate');
const {
  postUser,
  getUser,
  patchUser,
  deleteUser,
  getAllUsers,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/usersController');
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
  updateUserData,
} = require('../controllers/authController');
const { userSchema } = require('../controllers/schemas/auth');
const router = express.Router();

//PUBLIC ROUTES
//This route can be only called by a POST request
router.post('/signup', celebrate({ body: userSchema }), signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.patch('/update-password', protect, updatePassword);

//PROTECTED ROUTES
router.use(protect);

//If this route was below the /:id routes, the "me"
//would be taken as :id
router.route('/me').get(getMe, getUser);

//upload.single('photo') from multer will store the file in req.file
router.patch('/update-me', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/delete-me', deleteMe);

router.patch('/update-data', protect, updateUserData);

//ADMIN ROUTES
router.use(restrictTo('admin'));

//We keep these routes thats respects the REST format
//because it could be useful for an admin for example
router.route('/').get(getAllUsers).post(postUser);

router.route('/:id').get(getUser).patch(patchUser).delete(deleteUser);

module.exports = router;
