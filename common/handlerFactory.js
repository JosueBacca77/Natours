const { APIFeatures } = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const createAsync = require('../utils/catchAsync');

const deleteDocument = (Model) =>
      createAsync(async (req, res, next) => {
            const id = req.params.id;

            const document = await Model.findByIdAndRemove(id);

            if (!document) {
                  return next(new AppError('Document not found', 404));
            }

            res.status(204).send({
                  status: 'success',
            });
      });

const replaceDocument = (Model) =>
      createAsync(async (req, res, next) => {
            const id = req.params.id;

            const document = await Model.findOneAndReplace(id, req.body, {
                  returnDocument: 'after', //returns the document after updated (default is before)
            });

            if (!document) {
                  return next(new AppError('Document not found', 404));
            }

            res.status(200).send({
                  status: 'success',
                  data: document,
            });
      });

const createDocument = (Model) =>
      createAsync(async (req, res, next) => {
            // we can acces this body because of the middleware at app.js
            // otherwise, it will be undefined

            const body = req.body;

            const newDocument = Model(body);

            const createdDocument = await newDocument.save();

            res.status(201).send({
                  status: 'success',
                  data: createdDocument,
            });
      });

const updateDocument = (Model) =>
      createAsync(async (req, res, next) => {
            const id = req.params.id;

            const document = await Model.findByIdAndUpdate(id, req.body, {
                  new: true, //give us the object
                  //rawResult: true, //give us the hole document with mongo data
                  runValidators: true,
            });

            if (!document) {
                  return next(new AppError('Document not found', 404));
            }

            res.status(200).send({
                  status: 'success',
                  data: document,
            });
      });

const getDocument = (Model, populateOptions) =>
      createAsync(async (req, res, next) => {
            const documentId = req.params.id;

            let query = Model.findById(documentId);

            if (populateOptions) {
                  query = query.populate(populateOptions);
            }

            const document = await query;

            if (!document) {
                  return next(new AppError('Document not found', 404));
            }

            res.status(200).send({
                  status: 'success',
                  data: document,
            });
      });

const getAllDocuments = (Model) =>
      createAsync(async (req, res, next) => {
            //To allow for nested GET reviews on tour (hack)
            let filter = {};
            if (req.params.tourId) {
                  filter = { tour: req.params.tourId };
            }
            let query = Model.find(filter);

            const API = new APIFeatures(query, req.query).filter().sort();

            await API.paginate();

            // const documents = await API.query.explain();
            const documents = await API.query;

            res.status(200).send({
                  status: 'success',
                  results: documents.length,
                  data: {
                        tours: documents,
                  },
            });
      });

module.exports = {
      deleteDocument,
      replaceDocument,
      createDocument,
      updateDocument,
      getDocument,
      getAllDocuments,
};
