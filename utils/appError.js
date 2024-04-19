class AppError extends Error{
    constructor(message, statusCode) {
        super() //Whatever we pass to the Error class, it will be the error message

        this.statusCode = statusCode;
        this.code = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error' 
        this.isOperational = true;
        this.message = message;

        Error.captureStackTrace(this, this.constructor)

    }
}

module.exports = AppError;