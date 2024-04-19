const createAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next) //it makes possible to get rid of the try catch block in the controllers
    }
};

module.exports = createAsync;