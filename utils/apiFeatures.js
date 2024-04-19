const Tour = require('../models/tourModel');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // mongoose query that Im building
    this.queryString = queryString; //query from request
  }

  //has to be executed first
  filter() {
    //1A filtering
    const queryObject = { ...this.queryString };

    const excludedFiles = ['page', 'limit', 'sort', 'fields'];

    excludedFiles.forEach((field) => delete queryObject[field]);
    //1B Advanced filtering

    //{{base_url}}/api/v1/tours?difficulty=easy&maxGroupSize[gt]=8&ratingsAverage[lt]=10&duration[gte]=2
    const regex = /\b(gt|gte|lt|lte)\b/g;
    //B IS to find exactly these words, not lti for example

    //g is to replace all the ocurrences, not only the first one (if the
    //string is {"difficulty":"easy","ratingsAverage":{"lt":"4.6"},"duration":{"gte":"9"}
    //the result wiil be "difficulty":"easy","ratingsAverage":{"$lt":"4.6"},"duration":{"gte":"9"}}

    const queryExcludedString = JSON.stringify(queryObject);

    const queryExcludedStringReady = queryExcludedString.replace(
      regex,
      (match) => '$' + match,
    );

    const queryObjectReady = JSON.parse(queryExcludedStringReady);

    this.query.find(queryObjectReady);

    return this;
  }

  sort() {
    let sort = this.queryString?.sort;

    let sortBy = '-createdAt';

    const fields = this.queryString.fields;

    //ACTUALLY THERE IS NO NEED TO SEND QUERY PARAMS SEPARATED BY COMA, WE COULD
    //SEND QUERY PARAMS SEPARATED BY SPACE AND DONT HAVE TO DO .split(',').join(' ')

    if (sort && sort !== 'fields') {
      //this will replace only the first occurence
      //const sortFormatted = sort.replace(',', ' ')
      sortBy = sort.split(',').join(' ');
    }

    if (sort && sort === 'fields') {
      sortBy = fields.split(',').join(' ');
    }

    if (!fields) {
      this.query = this.query.select('-__v');
    } else {
      this.query = this.query.select(fields);
    }

    this.query.sort(sortBy);

    return this;
  }

  async paginate() {
    const limit = this.queryString?.limit * 1 || 10;

    const page = this.queryString?.page * 1 || 1;

    const offset = (page - 1) * limit;

    if (page) {
      const countTours = await Tour.countDocuments();

      if (offset >= countTours) {
        throw {
          code: 404,
          message: 'Page selected exceedes the amount of tours',
        };
      }
    }
    //page=3&limit=10
    //1-10 page 1, 11-20 page2, 21-30 page3
    this.query.skip(offset).limit(limit);

    return this;
  }
}

module.exports = {
  APIFeatures,
};
