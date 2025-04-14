import { DailyTargetsResult, DailyTargetsResultDb, Nutrition } from "@aicoach/shared";
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

	async setDailyTargets(userId: string, result: DailyTargetsResult): Promise<void> {
		await firestore()
			.doc(`users/${userId}/profiles/targets-profile`)
			.set({
				model: result.model,
				nutritons: result.nutritons,
				explanation: result.explanation,
				lastUpdated: FieldValue.serverTimestamp()
			} as DailyTargetsResultDb);
	}
}

export default new DailyTargetsService();
