import { FoodDb, FoodStatus } from "@aicoach/shared";
import { firestore } from "firebase-admin";

export class FoodService {
	async getUserFoodDocument(uid: string, foodId: string): Promise<FoodDb | undefined> {
		const documentRef = firestore().doc(`foods/${foodId}`);
		const documentData = await documentRef.get();

		if (!documentData.exists) {
			return undefined;
		}

		const data = documentData.data() as FoodDb;

		// Verify user has access to this food
		if (data.ownerUid !== uid && !data.isPublic) {
			return undefined;
		}

		return data;
	}

	async updateUserFoodDocument(uid: string, foodId: string, data: Partial<FoodDb>): Promise<void> {
		const documentRef = firestore().doc(`foods/${foodId}`);

		// Ensure only the food creator can update it
		const food = await this.getUserFoodDocument(uid, foodId);
		if (!food || food.ownerUid !== uid) {
			throw new Error("Unauthorized access to food document");
		}

		await documentRef.update(data);
	}

	async setFoodDocumentStatus(uid: string, foodId: string, status: FoodStatus): Promise<void> {
		const documentRef = firestore().doc(`foods/${foodId}`);

		// Ensure only the food creator can update status
		const food = await this.getUserFoodDocument(uid, foodId);
		if (!food || food.ownerUid !== uid) {
			throw new Error("Unauthorized access to food document");
		}

		await documentRef.update({ status });
	}
}

export default new FoodService();
