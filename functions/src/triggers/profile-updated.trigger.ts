import { UserProfileDb } from "@aicoach/shared";
import { auth } from "firebase-admin";
import { logger } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/firestore";

export const profileUpdated = onDocumentUpdated(
	{
		document: "users/{userId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const uid = event.params.userId;
		const oldDocument = event.data?.before.data() as UserProfileDb;
		const newDocument = event.data?.after.data() as UserProfileDb;

		if (!oldDocument || !newDocument) {
			return;
		}

		if (oldDocument.email !== newDocument.email) {
			const userRecord = await auth().getUser(uid);
			if (userRecord) {
				logger.info("User e-mail address changed, resetting verified status...", { uid, newEmail: newDocument.email });

				await auth().updateUser(userRecord.uid, {
					emailVerified: false
				});
			}
		}
	}
);
