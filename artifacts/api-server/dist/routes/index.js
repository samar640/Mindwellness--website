import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import chatbotRouter from "./chatbot.js";
const router = Router();
router.use(healthRouter);
router.use(authRouter);
router.use(chatbotRouter);
export default router;
