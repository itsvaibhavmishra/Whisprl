import express from "express";

import { allow, protect, staffOnly } from "#src/middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import { addToTeam, changeTeamAccess, getConfirmationOptions, getTeam, removeFromTeam } from "#src/controllers/adminController.js";

const adminRouter = express.Router();

// every admin route sits behind these, so none can be added without them
adminRouter.use(protect, staffOnly);

adminRouter.route("/confirm").post(writeLimit(), getConfirmationOptions);

adminRouter.route("/team").get(readLimit(), allow("team"), getTeam).post(writeLimit(), allow("team"), addToTeam);

adminRouter.route("/team/:user_id").put(writeLimit(), allow("team"), changeTeamAccess);

adminRouter.route("/team/:user_id/remove").put(writeLimit(), allow("team"), removeFromTeam);

export default adminRouter;
