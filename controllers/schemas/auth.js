const { Joi } = require('celebrate');
const { passwordRegex } = require('../../utils/regex');

const userRoles = ['client', 'guide', 'lead-guide', 'admin'];

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp(passwordRegex)).required(),
  passwordConfirm: Joi.string().pattern(new RegExp(passwordRegex)).required(),
  name: Joi.string().required(),
  photo: Joi.string(),
  role: Joi.string()
    .valid(...userRoles)
    .required(),
  passwordChangedAt: Joi.date(), //remove it when logic for changing password is implemented
});

module.exports = {
  userSchema,
};
