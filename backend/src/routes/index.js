import express from "express";

// router imports
import authRouter from "#src/routes/authRouter.js";
import userRouter from "#src/routes/userRouter.js";
import conversationRouter from "#src/routes/conversationRouter.js";
import messageRouter from "#src/routes/messageRouter.js";
import friendsRouter from "#src/routes/friendsRouter.js";
import keyRouter from "#src/routes/keyRouter.js";
import passkeyRouter from "#src/routes/passkeyRouter.js";
import groupRouter from "#src/routes/groupRouter.js";
import statusRouter from "#src/routes/statusRouter.js";

const router = express.Router();

router.use("/auth", authRouter);

router.use("/user", userRouter);

router.use("/conversation", conversationRouter);

router.use("/message", messageRouter);

router.use("/friends", friendsRouter);

router.use("/keys", keyRouter);

router.use("/passkeys", passkeyRouter);

router.use("/groups", groupRouter);

router.use("/status", statusRouter);

router.get("/start-server", (req, res) => {
  res.send("Welcome to Whisprl 😺");
});

export default router;
