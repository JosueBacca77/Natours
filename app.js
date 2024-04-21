const express = require("express");
const morgan = require("morgan");
const toursRouter = require("./routs/tourRutes");
const AppError = require("./utils/appError");
const { errors } = require("celebrate");
const usersRouter = require("./routs/userRoutes");
const errorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const helmet = require("helmet");
const app = express();
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const { whiteListParameters } = require("./configs");
const { reviewRoutes } = require("./routs/reviewRoutes");
const path = require("path");
const viewRouter = require("./routs/viewRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { bookingRoutes } = require("./routs/bookingRoutes");
const compression = require("compression");

// app.get('/api/v1/tours', getAllTours)
// app.get('/api/v1/tours/:id', getTour)
// app.post('/api/v1/tours/', postTour)
// app.patch('/api/v1/tours/:id', patchTour)
// app.delete('/api/v1/tours/:id', deleteTour)

// Configuración de CORS para permitir todas las solicitudes de origen
// app.use(cors());
//what this middleware does is set:
//Access-Control-Allow-Origin: *
// * means that any domain can access it

//Example:
app.use(cors({ origin: "https://natours-zey4.onrender.com" }));

//PUG is a whitespace sensitive  syntax for writing html
app.set("view engine", "pug");
//Pug templates are called views in express
//using we dont have to care about slashes or not
//we dont always know about the slashes in path we receives
app.set("views", path.join(__dirname, "views"));

//Serving static files
//we are telling that the static files are in the public folder
app.use(express.static(path.join(__dirname, "public")));

//security HTTP headers
// app.use(helmet());
app.use(helmet({ contentSecurityPolicy: false }));

//development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//limit request for same API
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 30, // 2 requests per window
  message: "Too many requests, please try again later.",
});
app.use("/api", limiter);

app.use(compression());

//Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

//Esto lo agerego el porque no accedia al body en el save setting
//que es con urlencoded
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//Data sanitization against NoSQL query injection

//This middleware looks at the req body, req query string and request params
//and filter out all the dollar signs and dots
app.use(mongoSanitize());
//Data sanitization against XSS

//This will clean any user input from
//malicious HTML code
app.use(xss());

//Prevent parameter pollution
//(will use only the last one)
app.use(
  hpp({
    whitelist: whiteListParameters,
  })
);

//Data sanitization against XSS
app.use(express.urlencoded({ extended: true }));

//multer
const storage = multer.memoryStorage(); // You can also specify a disk storage location
const upload = multer({ storage: storage });

//THIS MAKES POSSIBLE TO GET req.secure FROM THE SERVER IN RENDER
app.enable("trust proxy");

// app.get("/ip", (request, response) => response.send(request.ip));

//multer middleware
app.patch("/update", upload.none());

//Using own routers
app.use("/", viewRouter);
app.use("/api/v1/tours", toursRouter);

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/bookings", bookingRoutes);

//if the code get into this section, is because none of toursRouter or usersRouter
//could catch it, so the route doesnt exists
app.all("*", (req, res, next) => {
  next(new AppError(`The route ${req.url} doesn't exist`, 404));
});

// Handle validation errors
app.use(errors());

//In express, when a middleware has only four arguments
//express will regognize it as an error handling middleware and
//executes it only when there is an error
app.use(errorHandler);

module.exports = app;
