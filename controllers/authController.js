const User = require("../models/userModel");
const AppError = require("../utils/appError");
const createAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { Email } = require("../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    //req.secure ins an express variable
    //we can access to this because of app.set("trust proxy", 1);
    secure: req.secure,
    // secure: true // This is essential for HTTPS
  };

  //ADDITIONAL CONSIDERATION: If you're using a load balancer or reverse proxy, ensure it's configured to pass the secure flag correctly.

  //We cant do this because not all deployed applications are automatically set to https
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  //The password will be included in the response
  //(the select:false in the chema works for find operations)
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const signup = createAsync(async (req, res) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    phone,
    role,
    passwordChangedAt,
  } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    phone,
    passwordConfirm,
    role,
    passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;

  await new Email(newUser, url).sendWelcome();

  //expiresIn could be a integer (miliseconds) or in this format 90d 10h 5m 3s
  createSendToken(newUser, 201, req, res);
});

const login = createAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1)heck if email and password exist
  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));
  //we want to make sure after next(...) calling, login functions finishes right away

  //2)check if user exists and password is correct
  //we use + befoe password because it has set select: false in the schema
  //because in the gets we dont want to return the password
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 401));

  // 3) If everything ok, generate and send token to client
  createSendToken(user, 200, req, res);
});

//When we use token based authentication we dont need an endpoint like this
//but we do when we want to send a super secure cookie
const logout = (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    //in this case we dont use httpSecure: true because
    //there's not sensitive data
  });
  res.status(200).json({ status: "success" });
};

const protect = createAsync(async (req, res, next) => {
  //1 ) Getting token and check of it's there
  let token = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );

  //2) Verification token
  // jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  //     if(err) return next(new AppError('You are not logged in! Please log in to get access', 401))
  //     req.user = await User.findById(decoded.id)
  // })

  //Using promisify we dont have to use callbacks like in the commented code above
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //decoded ={ id: '657f822248a8a92a71da0215', user id
  //iat: 1703952794, timestamp of the creation date
  //exp: 1711728794 } expiration date

  //Most of the tutorials stop here, int he step 2, but it wouldn't be
  //secure enough
  //3) Check if user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    const err = new AppError(
      "The user belonging to this token does no longer exist",
      401
    );
    return next(err);
    // return next(new AppError('The user belonging to this token does no longer exist', 401))
  }

  //4) Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again", 401)
    );
  }

  //5) Grant access to protected route
  req.user = freshUser;
  //This is for user be able in pug templates
  res.locals.user = freshUser;
  next();
});

//Only for rendered pages, no errors
//we dont use createAsync here because it would throw an error when
//sending a request without be logged in, and in those cases
//we just want to execute next(), because this middleware is for
//adding the logged user to the locals, if there is
const isLoggedIn = async (req, res, next) => {
  let token = null;
  try {
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      const freshUser = await User.findById(decoded.id);

      if (!freshUser) {
        return next();
        // return next(new AppError('The user belonging to this token does no longer exist', 401))
      }

      //4) Check if user changed password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //Pug templates has acces to res.locals object
      res.locals.user = freshUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

/**
 * Restricts access to the function based on the roles provided.
 *
 * @param {...string} roles - The roles to restrict access to.
 * @return {undefined} - This function does not return a value.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

const forgotPassword = createAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  //if we do user.save(), this will demand all the required fields
  //in the user schema, we dont want to pass it, we are saving just
  //the passwordResetToken and passwordResetExpires
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email

  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email", 500));
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

const resetPassword = createAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken, //the only thing that we have rght now about the user
    passwordResetExpires: { $gt: Date.now() },
  });

  //remember passwordResetToken doesnt hae an expired date, it's a
  //crypto.randomBytes(32).toString('hex')

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password; //the new password

  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;

  user.passwordResetExpires = undefined;

  // 3) Update passwordChangedAt property for the user
  //(made it by middleware in schema)

  await user.save();

  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

const updatePassword = createAsync(async (req, res, next) => {
  const { currentPassword, password, confirmPassword } = req.body;

  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  const isCorrectPassword = await user.correctPassword(
    currentPassword,
    user.password
  );

  if (!isCorrectPassword) {
    return next(new AppError("Current password is incorrect", 401));
  }

  if (password !== confirmPassword) {
    return next(new AppError("Passwords do not match", 400));
  }

  // 3) If so, update password
  user.password = password;
  user.passwordConfirm = password;

  await user.save();

  //WE DONT DO User.findByIdAndUpdate(...) because of two reasons
  //1- If we do this, passwordConfirm validator is not gonna run (see model)
  //2- If we do this, the document middleware will not run ( .pre('save') )

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

const updateUserData = createAsync(async (req, res, next) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
  };

  const updatedUser = await User.findByIdAndUpdate(req.user.id, data, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    user: updatedUser,
  });
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
  isLoggedIn,
  logout,
  updateUserData,
};
