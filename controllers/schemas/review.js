const { Joi } = require('celebrate');

const reviewSchema = Joi.object({
  review: Joi.string().required(),
  rating: Joi.number().required().max(5).min(1),
  tour: Joi.string(),
});

module.exports = {
  reviewSchema,
};
