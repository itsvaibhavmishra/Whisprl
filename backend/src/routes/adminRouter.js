import express from "express";

import { allow, protect, staffOnly } from "#src/middlewares/authMiddleware.js";
import { readLimit, searchLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  addToTeam,
  ban,
  changeTeamAccess,
  closeGameRequest,
  dismiss,
  getAuditLog,
  getConfirmationOptions,
  getGameRequests,
  getOverview,
  getPeople,
  getReports,
  getTeam,
  removeFromTeam,
  restore,
  suspend,
} from "#src/controllers/adminController.js";

const adminRouter = express.Router();

// every admin route sits behind these, so none can be added without them
adminRouter.use(protect, staffOnly);

adminRouter.route("/overview").get(readLimit(), allow("overview"), getOverview);

adminRouter.route("/people").get(searchLimit(), allow("people"), getPeople);

adminRouter.route("/confirm").post(writeLimit(), getConfirmationOptions);

adminRouter.route("/people/:user_id/suspend").put(writeLimit(), allow("suspend"), suspend);

adminRouter.route("/people/:user_id/ban").put(writeLimit(), allow("ban"), ban);

// lifting needs whichever permission put it in place, which only the account itself can say
adminRouter.route("/people/:user_id/restore").put(writeLimit(), restore);

adminRouter.route("/reports").get(readLimit(), allow("reports"), getReports);

adminRouter.route("/reports/:report_id/dismiss").put(writeLimit(), allow("reports"), dismiss);

adminRouter.route("/game-requests").get(searchLimit(), allow("requests"), getGameRequests);

adminRouter.route("/game-requests/:name_key/close").put(writeLimit(), allow("requests"), closeGameRequest);

adminRouter.route("/audit").get(readLimit(), allow("audit"), getAuditLog);

adminRouter.route("/team").get(readLimit(), allow("team"), getTeam).post(writeLimit(), allow("team"), addToTeam);

adminRouter.route("/team/:user_id").put(writeLimit(), allow("team"), changeTeamAccess);

adminRouter.route("/team/:user_id/remove").put(writeLimit(), allow("team"), removeFromTeam);

export default adminRouter;
