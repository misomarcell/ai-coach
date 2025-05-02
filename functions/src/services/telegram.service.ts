import { AxiosInstance, create } from "axios";
import { Request, Response } from "express";
import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
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
				await this.handleStartCommand(update);
			}

			return response.status(200).send("OK");
		} catch (error) {
			logger.error("Error handling bot update", error);
			return response.status(200).send("OK");
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

		return this.saveChatId(connectCode, chatId, username);
	}

	private getUidByConnectCode(connectCode: string): Promise<string | undefined> {
		return firestore()
			.collection("users")
			.where("telegramConnectCode", "==", connectCode)
			.limit(1)
			.get()
			.then((querySnapshot) => {
				if (querySnapshot.empty) {
					return undefined;
				}

				return querySnapshot.docs[0].id;
			});
	}

	private async saveChatId(connectCode: string, chatId: number, username: string): Promise<void> {
		const uid = await this.getUidByConnectCode(connectCode);
		if (!uid) {
			await this.sendMessage(chatId, SOMETHING_WENT_WRONG_MESSAGE);

			throw new Error(`Connect code not found. ConnectCode: ${connectCode} ChatId: ${chatId}`);
		}

		try {
			await communicationService.setChannel(uid, {
				name: username,
				address: chatId.toString(),
				type: "telegram",
				lastUpdated: FieldValue.serverTimestamp(),
				created: FieldValue.serverTimestamp()
			});
			await this.sendMessage(chatId, "You've successfully connected to your KombuchAI account.");
			logger.info("ChatId saved to user document", chatId, username);
		} catch (error) {
			logger.error("Error saving chat id", { connectCode, chatId, error });
		}
	}
}

export default new TelegramService();
