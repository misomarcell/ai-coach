import { DailyTargetsDb, DailyTargetsResult, DailyTargetStatus, Nutrition } from "@aicoach/shared";
import { firestore } from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export class DailyTargetsService {
	async getDailyTagets(userId: string): Promise<Nutrition[] | undefined> {
		return firestore()
			.doc(`users/${userId}/profiles/targets-profile`)
			.get()
			.then((snapshot) => {
				if (!snapshot.exists) {
					return undefined;
				}

				const data = snapshot.data() as Nutrition[];

				return data || undefined;
			});
	}

	async updateTargetsStatus(userId: string, status: DailyTargetStatus): Promise<void> {
		await firestore()
			.doc(`users/${userId}/profiles/targets-profile`)
			.set(
				{
					status,
					lastUpdated: FieldValue.serverTimestamp()
				} as Partial<DailyTargetsDb>,
				{ merge: true }
			);
	}

	async setDailyTargets(userId: string, result: DailyTargetsResult): Promise<void> {
		await firestore()
			.doc(`users/${userId}/profiles/targets-profile`)
			.set({
				model: result.model,
				nutritons: result.nutritons,
				explanation: result.explanation,
				status: "ready",
				lastUpdated: FieldValue.serverTimestamp()
			} as DailyTargetsDb);
	}
}

export default new DailyTargetsService();
