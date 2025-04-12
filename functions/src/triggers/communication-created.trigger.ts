import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/firestore";
import { Communication } from "../models/communication.model";
import communicationService from "../services/communication.service";
import telegramService from "../services/telegram.service";
import { formatAnalysisResult } from "../utils/formatter.util";

export const communicationCreated = onDocumentCreated(
	{
		document: "users/{userId}/communications/{communicationId}",
		secrets: ["TELEGRAM_BOT_TOKEN"],
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const communication = snapshot?.data() as Communication;
		if (!snapshot || !communication) {
			return;
		}

		const uid = event.params.userId;
		const channel = communication.channel;
		switch (channel) {
			case "telegram":
				const telegramChannel = await communicationService.getTelegramChannel(uid);
				const chatId = telegramChannel?.chatId;
				if (!chatId) {
					logger.warn("Communication couldn't be sent because user is missing chatId", { uid });

					return;
				}

				if (communication.message.analysisResult) {
					const formattedAnalysis = formatAnalysisResult(communication.message.analysisResult);
					await sendTelegramMessage(chatId, formattedAnalysis).catch(logger.error);
				}
				break;
			default:
				break;
		}
	}
);

async function sendTelegramMessage(chatId: number, message: string): Promise<void> {
	if (!chatId || !message) {
		throw new Error("Failed to format message");
	}

	await telegramService.sendMessage(chatId, message);
}
