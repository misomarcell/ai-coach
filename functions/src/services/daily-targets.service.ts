import { DailyTargetsResult, Nutrition } from "@aicoach/shared";
import { firestore } from "firebase-admin";

export class DailyTargetsService {
	async getDailyTagets(userId: string, date: Date): Promise<Nutrition[] | undefined> {
		const dateKey = this.formatDate(date);

		return firestore()
			.doc(`users/${userId}/daily-targets/${dateKey}`)
			.get()
			.then((snapshot) => {
				if (!snapshot.exists) {
					return undefined;
				}

				const data = snapshot.data() as Nutrition[];

				return data || undefined;
			});
	}

	async setDailyTargets(userId: string, date: Date, result: DailyTargetsResult): Promise<void> {
		const dateKey = this.formatDate(date);
		await firestore()
			.doc(`users/${userId}/daily-targets/${dateKey}`)
			.set({ nutritons: result.nutritons, explanation: result.explanation } as DailyTargetsResult);
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	}
}

export default new DailyTargetsService();
