import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import createHttpError from "http-errors";

import { plainBody } from "#src/middlewares/plainBody.js";
import router from "#src/routes/index.js";
import { allowedOrigins } from "#src/utils/allowedOrigins.js";
import { reportError } from "#src/utils/errorReports.js";

const app = express();

// the host's proxy stands in front, and rate limits need the visitor's own address
app.set("trust proxy", 1);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(plainBody);

// rate limits sit on each route rather than here
app.use(helmet());
app.use(compression());

app.get("/", (req, res) => {
  res.send("Welcome to Whisprl Backend😺");
});

app.use("/api", router);

app.use((req, res, next) => {
  next(createHttpError.NotFound("This route does not exist!"));
});

const CLIENT_ERRORS = {
  MulterError: 400,
  ValidationError: 400,
  CastError: 400,
};

const statusOf = (error) => error.status || CLIENT_ERRORS[error.name] || (error.code === 11000 ? 409 : 500);

const messageOf = (error, status) => {
  if (error.code === 11000) return "That already exists";
  if (status < 500 || error.expose) return error.message;
  return "Something went wrong, please try again";
};

app.use((error, req, res, next) => {
  const status = statusOf(error);
  if (status >= 500) {
    console.error(error);
    reportError(error, req.user?._id);
  }

  res.status(status).send({
    error: {
      status: "error",
      message: messageOf(error, status),
      // what the browser should do next, such as renew its token or log in again
      ...(error.expose && typeof error.code === "string" && { code: error.code }),
    },
  });
});

export default app;
