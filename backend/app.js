import express from "express";

// security packages
import cors from "cors";
import helmet from "helmet";
import { xss } from "express-xss-sanitizer";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import createHttpError from "http-errors"; // error handler

// folder/file imports
import router from "#src/routes/index.js";

// creating express app
const app = express();

// Enable trust proxy
app.set("trust proxy", 1);

// cors setup
app.use(
  cors({
    origin: process.env.FRONT_URL || "http://localhost:3000",
  })
);

// parsing data to json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// security middlewares, rate limits sit on each route
app.use(helmet()); // general security
app.use(xss()); // xss protection
app.use(mongoSanitize()); // sanitization for mongodb
app.use(compression()); // gzip compression

// Index Route
app.get("/", (req, res) => {
  res.send("Welcome to Whisprl Backend😺");
});

// using api routes
app.use("/api", router);

// -------http error handling-------
app.use(async (req, res, next) => {
  next(createHttpError.NotFound("This route does not exist!"));
});

const CLIENT_ERRORS = { MulterError: 400, ValidationError: 400, CastError: 400 };

const statusOf = (error) => error.status || CLIENT_ERRORS[error.name] || (error.code === 11000 ? 409 : 500);

const messageOf = (error, status) => {
  if (error.code === 11000) return "That already exists";
  if (status < 500 || error.expose) return error.message;
  return "Something went wrong, please try again";
};

// error handling
app.use((error, req, res, next) => {
  const status = statusOf(error);
  if (status >= 500) console.error(error);

  res.status(status).send({
    error: {
      status: "error",
      message: messageOf(error, status),
      // what the browser should do next, such as renew its token or log in again
      ...(error.expose && typeof error.code === "string" && { code: error.code }),
    },
  });
});
// ---------------------------------

export default app;
