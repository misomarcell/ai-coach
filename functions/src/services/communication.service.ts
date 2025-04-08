import { AnalysisCommunicationChannel } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Communication, CommunicationMessage } from "../models/communication.model";

export class CommunicationService {
	async createCommunication(uid: string, channel: AnalysisCommunicationChannel, message: CommunicationMessage): Promise<void> {
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
}

export default new CommunicationService();
