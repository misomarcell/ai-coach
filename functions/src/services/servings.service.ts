import { ServingDb } from "@aicoach/shared";
import { firestore } from "firebase-admin";

export type GetServingsOptions = {
	before: Date;
	after: Date;
	limit?: number;
};

export class ServingsService {
	async getUserServings(uid: string, options: GetServingsOptions): Promise<ServingDb[]> {
		const collectionRef = firestore().collection(`users/${uid}/servings`);
		const queryRef = collectionRef
			.where("created", ">=", options.after)
			.where("created", "<=", options.before)
			.orderBy("created", "desc")
			.limit(options.limit || 250);

		return queryRef.get().then((snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ServingDb)));
	}
}

export default new ServingsService();
