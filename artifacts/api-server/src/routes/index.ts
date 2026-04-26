import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import chatbotRouter from "./chatbot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatbotRouter);

export default router;
