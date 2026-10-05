import express from "express";

import { protect } from "../middlewares/authMiddleware.js";
import { addKey, getKeys, updateBackup } from "../controllers/keyController.js";

const keyRouter = express.Router();

keyRouter.route("/").get(protect, getKeys).post(protect, addKey);

keyRouter.route("/backup").put(protect, updateBackup);

export default keyRouter;
