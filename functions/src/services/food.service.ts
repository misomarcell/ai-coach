import { FoodDb, FoodStatus } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

	async getFoodByBarcode(barcode: string): Promise<FoodDb | undefined> {
		const collectionRef = firestore().collection("foods");
		const querySnapshot = await collectionRef.where("barcode", "==", barcode).get();

		if (querySnapshot.empty) {
			return undefined;
		}

		return querySnapshot.docs[0].data() as FoodDb;
	}

	async createFoodDocument(data: FoodDb): Promise<string> {
		const documentRef = firestore().collection("foods").doc();
		await documentRef.set({ ...data, id: data.id || documentRef.id });

		return documentRef.id;
	}

	async updateFoodDocument(foodId: string, foodData: FoodDb): Promise<void> {
		const documentRef = firestore().doc(`foods/${foodId}`);
		await documentRef.set(foodData, { merge: true });
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

	async increaseAddedCounter(foodId: string): Promise<void> {
		const documentRef = firestore().doc(`foods/${foodId}`);

		await documentRef.update({
			"counters.added": FieldValue.increment(1)
		});
	}

	async decreaseAddedCounter(foodId: string): Promise<void> {
		const documentRef = firestore().doc(`foods/${foodId}`);

		await documentRef.update({
			"counters.added": FieldValue.increment(-1)
		});
	}
}

export default new FoodService();
