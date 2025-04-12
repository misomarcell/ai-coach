import { AxiosInstance, create } from "axios";
import { Request, Response } from "express";
import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { TelegramUpdate } from "../models/telegram-message.model";
import communicationService from "./communication.service";

const apiKey = defineSecret("TELEGRAM_BOT_TOKEN");
const SOMETHING_WENT_WRONG_MESSAGE =
	"Something went wrong while connecting your account. Please refresh the website and click on the connect button again.";

export class TelegramService {
	private _client: AxiosInstance | undefined;
	private get client(): AxiosInstance {
		this._client =
			this._client ??
			create({
				baseURL: `https://api.telegram.org/bot${apiKey.value()}/`
			});

		return this._client;
	}

	async handleBotUpdate(request: Request, response: Response): Promise<Response> {
		if (!request.body) {
			return response.status(400).send("No body provided");
		}

		try {
			const update: TelegramUpdate = request.body;
			if (update.message?.text?.startsWith("/start")) {
				this.handleStartCommand(update);
			}

			return response.status(200).send("OK");
		} catch (error) {
			logger.error("Error handling bot update", error);
			return response.status(500).send("Internal server error");
		}
	}

	async sendMessage(chatId: number, text: string): Promise<void> {
		await this.client
			.post("sendMessage", {
				text,
				chat_id: chatId,
				parse_mode: "HTML"
			})
			.catch((error) => {
				logger.error("AXIOS Error sending message", { chatId, text, error });
			});
	}

	private async handleStartCommand(update: TelegramUpdate): Promise<void> {
		const chatId = update.message.from.id;
		const connectCode = update.message.text.split(" ")[1];
		const username = update.message.from.username;

		if (!chatId || !connectCode || !username) {
			await this.sendMessage(chatId, SOMETHING_WENT_WRONG_MESSAGE);
			return;
		}

		await this.saveChatId(connectCode, chatId, username);
	}

	private async saveChatId(connectCode: string, chatId: number, username: string): Promise<void> {
		const query = firestore().collection("users").where("telegramConnection.connectCode", "==", connectCode).limit(1);
		const relevantUserDocs = await query.get();
		if (!relevantUserDocs.size) {
			await this.sendMessage(chatId, SOMETHING_WENT_WRONG_MESSAGE);

			throw new Error("Connect code not found");
		}

		try {
			const userDoc = relevantUserDocs.docs[0];
			if (!userDoc.exists || !userDoc.id) {
				logger.error("User document not found", { connectCode });

				throw new Error("User document not found");
			}

			const uid = userDoc.id;

			await communicationService.setTelegramChannel(uid, { connectCode, username, chatId });
			await this.sendMessage(chatId, "You've successfully connected to your KombuchAI account.");
			logger.info("ChatId saved to user document", chatId, username);
		} catch (error) {
			logger.error("Error saving chat id", { connectCode, chatId, error });
		}
	}
}

export default new TelegramService();
