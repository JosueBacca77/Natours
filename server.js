const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (error) => {
  console.log("UNCAUGHT EXCEPTION");
  console.log(error.name, error.message);
  //we dont need to close the server because this
  //scenario happens in the synchronous code
  //we dont have to wait for any request to be finished
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });
const app = require("./app");

app.set("trust proxy", 1);
app.get("/ip", (request, response) => response.send(request.ip));
app.get("/x-forwarded-for", (request, response) =>
  response.send(request.headers["x-forwarded-for"])
);

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    //process.env.DATABASE_LOCAL
    useNewUrlParser: true, //these 3 options are just for dealing with some deprecation warnings
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connection) => {
    console.log("DB connection successfull!");
  });

//Starting server
const port = process.env.PORT; //Heroku needs this PORT env variable

const server = app.listen(port, () => {
  console.log(`App running in port ${port}`);
});

//Is not a good practice to blindly rely on unhandledRejection and
//uncaughtException handlers, but they are useful to have a safety net
process.on("unhandledRejection", (error) => {
  console.log("UNHANDLED REJECTION");
  console.log(error.name, error.message);
  //DOING THIS we give time to the server to finish all pending requests
  server.close(() => {
    process.exit(1); //0 for success, 1 for uncaught exception
  });
});
