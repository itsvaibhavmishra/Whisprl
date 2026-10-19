import "dotenv/config";
import http from "http";
import mongoose from "mongoose";

import app from "#app.js";
import { initializeSocket } from "#socket.js";
import { deleteDueAccounts } from "#src/services/accountDeletionService.js";
import { sweepExpiredMessages } from "#src/services/disappearingService.js";
import { sweepOldEvidence } from "#src/services/reportQueueService.js";
import { dropKeylessSessions } from "#src/services/sessionService.js";
import { sweepExpiredStatuses } from "#src/services/statusService.js";
import { clearDefaultStatuses, giveEveryoneACoverStyle } from "#src/services/userService.js";
import { giveEveryoneAUsername } from "#src/services/usernameService.js";
import { flushErrorReports, reportError, startErrorReports } from "#src/utils/errorReports.js";

startErrorReports();

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
    giveEveryoneACoverStyle()
      .then((given) => given && console.log(`[DB] Gave ${given} accounts a cover style`))
      .catch((error) => console.log(`[DB] Cover styles not given: ${error.message}`));
    clearDefaultStatuses()
      .then((cleared) => cleared && console.log(`[DB] Cleared ${cleared} default statuses`))
      .catch((error) => console.log(`[DB] Default statuses not cleared: ${error.message}`));
    dropKeylessSessions()
      .then((dropped) => dropped && console.log(`[DB] Ended ${dropped} sessions from before session keys`))
      .catch((error) => console.log(`[DB] Old sessions not ended: ${error.message}`));
    deleteDueAccounts(app.get("io"))
      .then((deleted) => deleted && console.log(`[DB] Deleted ${deleted} accounts that were due while the server was off`))
      .catch((error) => console.log(`[DB] Due accounts not deleted: ${error.message}`));
    const sweepFailed = (error) => {
      console.log(`[DB] Sweep failed: ${error.message}`);
      reportError(error);
    };
    setInterval(() => {
      deleteDueAccounts(app.get("io")).catch(sweepFailed);
      sweepExpiredMessages(app.get("io")).catch(sweepFailed);
      sweepExpiredStatuses().catch(sweepFailed);
      sweepOldEvidence().catch(sweepFailed);
    }, SWEEP_EVERY_MS);
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
  reportError(error);
  flushErrorReports().finally(exitHandler);
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
