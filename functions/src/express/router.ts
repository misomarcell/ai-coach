import { Request, Response, Router } from "express";
import telegramService from "../services/telegram.service";

const router = Router();

router.post("/tg-message-handler", async (request: Request, response: Response) => telegramService.handleBotUpdate(request, response));

export { router };
