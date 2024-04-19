const Tour = require("../models/tourModel");

const getTourImages = async (req, res) => {
    try {

        const tourId = req.params?.id;

        const tour = await Tour.findById(tourId)

        res.status(200).send(
            {
                status: 'success',
                data: {
                    images: tour.images
                }
            }
        )
    }
    catch (err) {
        res.status(400).send(
            {
                status: 'error',
                data: {
                    message: 'Error getting tour images'
                }
            }
        )
    }
}

module.exports = {
    getTourImages
}