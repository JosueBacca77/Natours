const fs = require('fs');
const { isNumber } = require('../utils/common');

const dataUrl = `${__dirname}/../dev-data/data/tours-simple.json`;

const checkTourBody = (req, res, next) => {
      const body = req.body;

      let error = '';
      if (!body.name) {
            error = 'Invalid name';
      }
      if (!body.price) {
            error = 'Invalid price';
      }
      if (error) {
            return res.status(400).send({
                  status: 'Error',
                  message: `Cannot create tour. ${error}`,
            });
      }
      next();
};

const getTours = () => {
      try {
            return JSON.parse(fs.readFileSync(dataUrl));
      } catch {
            return [];
      }
};

const tours = getTours();

const checkTourId = (req, res, next, value) => {
      if (!isNumber(value) || value * 1 > tours.length) {
            return res.status(404).send({
                  status: 'error',
                  message: `Invalid tour id`,
            });
      }
      next();
};

const saveToursPromise = (tours) => {
      return new Promise((resolve, reject) => {
            fs.writeFile(dataUrl, JSON.stringify(tours), (err) => {
                  if (err) {
                        reject(err);
                  }
                  resolve(tours);
            });
      });
};

const getAllTours = (req, res) => {
      res.status(200).send({
            status: 'success',
            results: tours.length,
            time: req.requestTime,
            data: {
                  tours,
            },
      });
};

const getTour = (req, res) => {
      const tourId = req.params.id;

      const tour = tours.find(
            (tour) => tour.id.toString() === tourId.toString(),
      );

      if (!tour) {
            res.status(404).send({
                  status: 'error',
                  message: `Tour with ID ${tourId} not found`,
            });
      }

      res.status(200).send({
            status: 'success',
            data: {
                  tour,
            },
      });
};

const createTour = async (tour) => {
      try {
            let currentTours = [...tours];

            currentTours.push(tour);

            return await saveToursPromise(currentTours);
      } catch (err) {
            throw err;
      }
};

const postTour = async (req, res) => {
      try {
            // we can acces this body because of the middleware at the top
            // otherwise, it will be undefined

            let newId = 1;
            if (tours.length > 0) {
                  newId = tours[tours.length - 1].id + 1;
            }

            //let newTour = { ...req.body }
            //newTour.id = newId
            const newTour = Object.assign({ id: newId }, req.body);
            toursUpdated = await createTour(newTour);

            const tourAdded = toursUpdated.find(
                  (tour) => tour.id.toString() === newId.toString(),
            );

            res.status(200).send({
                  status: 'success',
                  data: {
                        tour: tourAdded,
                  },
            });
      } catch (err) {
            res.status(500).send({
                  status: 'error',
                  data: {
                        message: err.message,
                  },
            });
      }
};

const patchTour = (req, res) => {
      const tour = tours.find((tour) => tour.id === tourId);

      if (!tour) {
            res.status(404).send({
                  status: 'error',
                  message: `Tour with ID ${tourId} not found`,
            });
      }

      const updatedProperties = req.body;

      const updatedTour = { ...tour };

      Object.keys(updatedProperties).forEach((key) => {
            updatedTour[key] = updatedProperties[key];
      });

      const updatedTours = tours.map((tour) => {
            if (tour.id === tourId) {
                  return updatedTour;
            }
            return tour;
      });

      fs.writeFile(dataUrl, JSON.stringify(updatedTours), (err) => {
            res.status(200).send({
                  status: 'success',
                  data: {
                        tour: updatedTour,
                  },
            });
      });
};

const deleteTour = (req, res) => {
      const tourId = req.params?.id * 1 ?? '';

      const tour = tours.find((tour) => tour.id === tourId);

      if (!tour) {
            res.status(404).send({
                  status: 'error',
                  message: `Tour with ID ${tourId} not found`,
            });
      }

      res.status(204).send();
};

module.exports = {
      getTour,
      getAllTours,
      postTour,
      patchTour,
      deleteTour,
      checkTourId,
      checkTourBody,
};
