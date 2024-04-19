const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const { passwordRegex } = require('../utils/regex');
const bcrypt = require('bcryptjs');
const { userRoles } = require('../controllers/schemas/auth');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
      name: {
            type: String,
            required: [true, 'User name is requied'],
      },
      email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            unique: true,
            validate: {
                  validator: validator.isEmail,
                  message: 'Please provide a valid email',
            },
      },
      photo: {
            type: String,
            default: 'default.jpg',
      },
      role: {
            type: String,
            enum: userRoles,
            required: true,
      },
      password: {
            type: String,
            required: [true, 'Password is required'],
            validate: {
                  validator: function () {
                        return this.password.match(passwordRegex);
                  },
                  message: 'Password must include at least one special character, one lowercase letter, one uppercase letter, and be between 8 and 15 characters long',
            },
            select: false,
      },
      passwordConfirm: {
            type: String,
            required: [true, 'Password confirm is required'],
            validate: [
                  {
                        //this only work on CREATE and SAVE!!
                        validator: function () {
                              return this.password === this.passwordConfirm;
                        },
                        message: "Passwords don't not match",
                  },
                  {
                        validator: function () {
                              return this.password.match(passwordRegex);
                        },
                        message: 'Password must include at least one special character, one lowercase letter, one uppercase letter, and be between 8 and 15 characters long',
                  },
            ],
      },
      passwordChangedAt: Date,
      passwordResetToken: String,
      passwordResetExpires: Date,
      slug: {
            type: String,
      },
      active: {
            type: Boolean,
            default: true,
            select: false,
      },
});

// Middleware to exclude inactive users
userSchema.pre(/^find/, function (next) {
      this.find({ active: { $ne: false } });
      next();
});

// Document middleware: runs before .save() and .create(), NOT BEFORE .insertMany()
userSchema.pre('save', async function (next) {
      this.slug = slugify(this.name, {
            lower: true,
            trim: true,
            replacement: '-',
      });
      next();
});

//COMMENT THIS AND THE NEXT ONE FOR IMPORT DATA
userSchema.pre('save', async function (next) {
      //Only run this function if password was actually modified
      if (!this.isModified('password')) return next();

      //Hash the password with cost of 12
      this.password = await bcrypt.hash(this.password, 12);

      //passwordConfirm is only nedeed for validation
      this.passwordConfirm = undefined;

      next();
});

userSchema.pre('save', function (next) {
      if (!this.isModified('password') || this.isNew) return next();

      //sometimes, saving to the databse is a little bit
      //slower than issuing the JWT, making the
      //changed password timestamp set a bit after the JWT has
      //been created ( the new token is from 19:00 and the changed
      // password time is 19:01), it woul mean that pasword has changed
      //after the token creation, so the new token wouln't be valid.
      this.passwordChangedAt = Date.now() - 1000;
      next();
});

//instance method, a method that will be available on all documents
userSchema.methods.correctPassword = async function (
      candidatePassword,
      userPassword,
) {
      //we add userPassword parameter because we can't use this.password
      //becuase password has select: false
      const res = await bcrypt.compare(candidatePassword, userPassword);
      return res;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
      //timestamp that indicates when the token was issued
      //if the user hasn't changed their password (doesnt have passwordChangedAt), return false
      if (this.passwordChangedAt) {
            //user has change its password
            const changedTimestamp = parseInt(
                  this.passwordChangedAt.getTime() / 1000,
                  10,
            );
            return JWTTimestamp < changedTimestamp;
      }
      return false;
};

userSchema.methods.createPasswordResetToken = function () {
      //create a token
      const resetToken = crypto.randomBytes(32).toString('hex');

      //We shouldn't save this plain text token in DB
      //hash the token
      this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
      //set expire

      this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //expires 10 minutes after creation
      return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
