import { firestore } from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import analysisService from "../services/diet-analysis.service";

export const scheduledRun = onSchedule(
	{
		schedule: "0 10 * * SAT",
		timeZone: "Europe/Budapest",
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1",
		secrets: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
	},
	async () => {
		const snapshot = await firestore().collection("users").get();
		const promises = snapshot.docs.map(async (doc) => {
			try {
				const userId = doc.id;
				await analysisService.createAnalysisRequest(userId, "gpt-4o");
			} catch (error) {
				logger.error("Error creating scheduled analysis for user", { uid: doc.id, error });
			}
		});

		await Promise.all(promises).catch((error) => logger.error("Error while creating scheduled analysis requests.", error));
	}
);
