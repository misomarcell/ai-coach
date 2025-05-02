import { CommunicationChannelDb, CommunicationChannelType } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Communication, CommunicationMessage } from "../models/communication.model";

export class CommunicationService {
	async createCommunication(uid: string, channelType: CommunicationChannelType, message: CommunicationMessage): Promise<void> {
		if (!uid || !message) {
			throw new Error("Failed to create communication, uid or message is missing.");
		}

		const doc = firestore().collection(`users/${uid}/communications`).doc();
		const data: Communication = {
			uid,
			message,
			channelType,
			id: doc.id,
			created: FieldValue.serverTimestamp()
		};

		await doc.set(data);
	}

	async getCommunicationChannels(uid: string): Promise<CommunicationChannelDb[]> {
		const coll = await firestore().collection(`users/${uid}/communication-channels`).get();

		if (coll.empty) {
			return [];
		}

		return coll.docs.map((doc) => doc.data() as CommunicationChannelDb);
	}

	async getChannel(uid: string, type: CommunicationChannelType): Promise<CommunicationChannelDb | undefined> {
		const coll = await firestore().collection(`users/${uid}/communication-channels`).where("type", "==", type).get();

		if (coll.empty) {
			return undefined;
		}

		return coll.docs[0].data() as CommunicationChannelDb;
	}

	async setChannel(uid: string, channel: Omit<CommunicationChannelDb, "id">): Promise<void> {
		if (!uid || !channel) {
			throw new Error("Failed to set communication channel, uid or channel is missing.");
		}

		const docRef = firestore().collection(`users/${uid}/communication-channels`).doc();

		await docRef.set(channel, { merge: true });
	}
}

export default new CommunicationService();
