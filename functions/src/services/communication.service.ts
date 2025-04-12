import { CommunicationChannel, TelegramChannel } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Communication, CommunicationMessage } from "../models/communication.model";

export class CommunicationService {
	async createCommunication(uid: string, channel: CommunicationChannel, message: CommunicationMessage): Promise<void> {
		if (!uid || !message) {
			throw new Error("Failed to create communication, uid or message is missing.");
		}

		const doc = firestore().collection(`users/${uid}/communications`).doc();
		const data: Communication = {
			uid,
			message,
			channel,
			id: doc.id,
			created: FieldValue.serverTimestamp()
		};

		await doc.set(data);
	}

	async getTelegramChannel(uid: string): Promise<TelegramChannel | undefined> {
		const doc = await firestore().doc(`users/${uid}/communication-channels/telegram`).get();
		if (!doc.exists) {
			return undefined;
		}

		const channel = doc.data() as TelegramChannel;
		return channel;
	}

	async setTelegramChannel(uid: string, channel: TelegramChannel): Promise<void> {
		if (!uid || !channel) {
			throw new Error("Failed to set telegram channel, uid or channel is missing.");
		}

		const doc = firestore().collection(`users/${uid}/communication-channels`).doc("telegram");
		await doc.set(channel, { merge: true });
	}
}

export default new CommunicationService();
