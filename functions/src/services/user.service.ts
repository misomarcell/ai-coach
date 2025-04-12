import { CommunicationChannel, HealthProfileDb, UserProfileDb } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { WriteResult } from "firebase-admin/firestore";
export class UserService {
	async getUserProfile(userId: string): Promise<UserProfileDb> {
		const userDoc = await firestore().collection("users").doc(userId);
		const userDocSnapshot = await userDoc.get();

		return userDocSnapshot.data() as UserProfileDb;
	}

	async getHealthProfile(userId: string): Promise<HealthProfileDb | undefined> {
		const docRef = firestore().doc(`users/${userId}/profiles/health-profile`);
		const docSnapshot = await docRef.get();

		if (!docSnapshot.exists) {
			return undefined;
		}

		return docSnapshot.data() as HealthProfileDb;
	}

	async updateUserProfile(userId: string, value: Partial<UserProfileDb>): Promise<WriteResult> {
		const userDoc = await firestore().collection("users").doc(userId);
		const userDocSnapshot = await userDoc.get();
		if (!userDocSnapshot.exists) {
			throw new Error("User not found");
		}

		return userDoc.set(value, { merge: true });
	}

	async getUserCommunicationChannels(userId: string): Promise<CommunicationChannel[]> {
		const collectionRef = await firestore().collection(`users/${userId}/communication-channels`);
		const collectionSnapshot = await collectionRef.get();
		if (collectionSnapshot.empty) {
			return [];
		}

		return collectionSnapshot.docs.map((doc) => doc.id as CommunicationChannel);
	}
}

export default new UserService();
