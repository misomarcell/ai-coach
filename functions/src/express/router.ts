import { Request, Response, Router } from "express";
import telegramService from "../services/telegram.service";
import * as openff from "./handlers/openff-handler";

const router = Router();

router.post("/tg-message-handler", async (request: Request, response: Response) => telegramService.handleBotUpdate(request, response));
router.get("/p/:barcode", async (request: Request, response: Response) => openff.handle(request, response));

export { router };
