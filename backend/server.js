import "dotenv/config";
import http from "http";
import mongoose from "mongoose";

import app from "#app.js";
import { initializeSocket } from "#socket.js";
import { sweepExpiredMessages } from "#src/services/disappearingService.js";
import { giveEveryoneAUsername } from "#src/services/usernameService.js";

// env variables
const port = process.env.PORT || "5000";
const SWEEP_EVERY_MS = 60 * 1000;

// ---------Setting up Database---------
// mongodb error handling
mongoose.connection.on("error", (err) => {
  console.log(`Error connecting with DB: ${err}`);
  process.exit(1);
});

// DB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("[DB] Connection Success");
    giveEveryoneAUsername()
      .then((given) => given && console.log(`[DB] Gave ${given} accounts a username`))
      .catch((error) => console.log(`[DB] Usernames not given: ${error.message}`));
    setInterval(() => sweepExpiredMessages(app.get("io")).catch((error) => console.log(`[DB] Sweep failed: ${error.message}`)), SWEEP_EVERY_MS);
  })
  .catch((err) => {
    console.log(`[DB] ${err.message}`);
    process.exit(1);
  });

// ------------------------------------

// create server
const server = http.createServer(app);

// Initialize Socket.io
app.set("io", initializeSocket(server));

server.listen(port, () => {
  console.log(`Server on port ${port}`);
});

// ---------Handling server errors---------
const exitHandler = () => {
  if (server) {
    console.log("Closing Server...");
    process.exit(1);
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.log(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

// SIGTERM Handling - (works for deployed linux based server)
process.on("SIGTERM", () => {
  if (server) {
    console.log("Closing Server...");
    process.exit(1);
  }
});

// ---------------------------------------
