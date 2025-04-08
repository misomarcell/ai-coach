import { UserProfileDb } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { WriteResult } from "firebase-admin/firestore";
export class UserService {
	async getUserProfile(userId: string): Promise<UserProfileDb> {
		const userDoc = await firestore().collection("users").doc(userId);
		const userDocSnapshot = await userDoc.get();

		return userDocSnapshot.data() as UserProfileDb;
	}

	async updateUser(userId: string, value: Partial<UserProfileDb>): Promise<WriteResult> {
		const userDoc = await firestore().collection("users").doc(userId);
		const userDocSnapshot = await userDoc.get();
		if (!userDocSnapshot.exists) {
			throw new Error("User not found");
		}

		return userDoc.set(value, { merge: true });
	}
}

export default new UserService();
