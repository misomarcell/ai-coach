import { CalorieVisionDb, CalorieVisionStatus } from "@aicoach/shared";
import { logger } from "firebase-functions";
import { onDocumentUpdated } from "firebase-functions/firestore";
import visionService from "../services/vision.service";

export const visionDocumentUpdated = onDocumentUpdated(
	{
		document: "users/{userId}/calorie-vision/{documentId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		secrets: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const userId = event.params.userId;
		const documentId = event.params.documentId;

		if (!snapshot) {
			logger.error("Vision document not found");
			return;
		}

		const newData = snapshot.after.data() as CalorieVisionDb;
		if (newData.status === CalorieVisionStatus.Submitted) {
			logger.info("Vision document status updated to Submitted. Processing upload...");
			await visionService.processVisionUpload(userId, documentId);
		}
	}
);
