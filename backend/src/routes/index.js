import express from "express";

import authRouter from "#src/routes/authRouter.js";
import userRouter from "#src/routes/userRouter.js";
import conversationRouter from "#src/routes/conversationRouter.js";
import messageRouter from "#src/routes/messageRouter.js";
import friendsRouter from "#src/routes/friendsRouter.js";
import keyRouter from "#src/routes/keyRouter.js";
import passkeyRouter from "#src/routes/passkeyRouter.js";
import groupRouter from "#src/routes/groupRouter.js";
import statusRouter from "#src/routes/statusRouter.js";
import onboardingRouter from "#src/routes/onboardingRouter.js";
import adminRouter from "#src/routes/adminRouter.js";
import gameRouter from "#src/routes/gameRouter.js";
import pushRouter from "#src/routes/pushRouter.js";
import { protect, requireAgeCheck } from "#src/middlewares/authMiddleware.js";

const router = express.Router();
// everything shared with other people waits for the age check that setup asks for
const withOthers = [protect, requireAgeCheck];

router.use("/auth", authRouter);

router.use("/user", userRouter);

router.use("/conversation", ...withOthers, conversationRouter);

router.use("/message", ...withOthers, messageRouter);

router.use("/friends", ...withOthers, friendsRouter);

router.use("/keys", keyRouter);

router.use("/passkeys", passkeyRouter);

router.use("/groups", ...withOthers, groupRouter);

router.use("/status", ...withOthers, statusRouter);

router.use("/onboarding", onboardingRouter);

router.use("/admin", adminRouter);

router.use("/games", ...withOthers, gameRouter);

router.use("/push", pushRouter);

router.get("/start-server", (req, res) => {
  res.send("Welcome to Whisprl 😺");
});

export default router;
