import { AccountDeletionDb } from "@aicoach/shared";
import { auth, firestore } from "firebase-admin";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

const COLLECTION_NAME = "account-deletions";

export const accountDeletionRequestCreated = onDocumentCreated(
	{
		document: `${COLLECTION_NAME}/{requestId}`,
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		if (!snapshot) {
			logger.error("Account deletion request data not found");
			return;
		}

		const request = snapshot.data() as AccountDeletionDb;
		const uid = request.uid;
		if (!uid) {
			logger.error("Account deletion request does not contain a valid user ID");
			return;
		}

		try {
			logger.info(`Processing account deletion request ${request.id}`);
			await auth()
				.updateUser(uid, { disabled: true })
				.then(() => logger.info(`User ${uid} disabled successfully`));

			await firestore()
				.collection(COLLECTION_NAME)
				.doc(request.id)
				.update({ status: "completed" } as Partial<AccountDeletionDb>);
		} catch (error) {
			logger.error(`Error processing account deletion request ${request.id}`, error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			await firestore()
				.collection(COLLECTION_NAME)
				.doc(request.id)
				.update({ status: "failed", error: errorMessage } as Partial<AccountDeletionDb>);
		}
	}
);
