import http from "http";
import mongoose from "mongoose";

import app from "#app.js";
import { initializeSocket } from "#socket.js";
import { deleteDueAccounts } from "#src/services/accountDeletionService.js";
import { sweepExpiredMessages } from "#src/services/disappearingService.js";
import { sweepOldEvidence } from "#src/services/reportQueueService.js";
import { sweepExpiredStatuses } from "#src/services/statusService.js";
import { syncOwnerBadge } from "#src/services/teamService.js";
import { ensureWhisprl } from "#src/services/whisprlService.js";
import { welcomeEveryone } from "#src/services/whisprlMessageService.js";
import { resumeAnnouncements } from "#src/services/announcementService.js";
import { greetBirthdays } from "#src/services/birthdayGreetingService.js";
import { tellGameRequesters } from "#src/services/gameRequestService.js";
import { flushErrorReports, reportError, startErrorReports } from "#src/utils/errorReports.js";

startErrorReports();

const port = process.env.PORT || "5000";
const SWEEP_EVERY_MS = 60 * 1000;

mongoose.connection.on("error", (err) => {
  console.log(`Error connecting with DB: ${err}`);
  process.exit(1);
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("[DB] Connection Success");
    syncOwnerBadge().catch((error) => console.log(`[DB] Owner badge not synced: ${error.message}`));
    ensureWhisprl()
      .then(welcomeEveryone)
      .then(() => resumeAnnouncements(app.get("io")))
      .catch((error) => console.log(`[DB] Whisprl account not ready: ${error.message}`));
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
      greetBirthdays(app.get("io")).catch(sweepFailed);
      tellGameRequesters(app.get("io")).catch(sweepFailed);
    }, SWEEP_EVERY_MS);
  })
  .catch((err) => {
    console.log(`[DB] ${err.message}`);
    process.exit(1);
  });

const server = http.createServer(app);

app.set("io", initializeSocket(server));

server.listen(port, () => {
  console.log(`Server on port ${port}`);
});

const closeServer = () => {
  console.log("Closing Server...");
  process.exit(1);
};

const unexpectedErrorHandler = (error) => {
  console.log(error);
  reportError(error);
  flushErrorReports().finally(closeServer);
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
process.on("SIGTERM", closeServer);
