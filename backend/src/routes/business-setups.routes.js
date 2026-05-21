import express from "express";
import { listAllBusinessSetups } from "../controllers/business-setups.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/all", listAllBusinessSetups);

export default router;
