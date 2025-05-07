import { logger } from "firebase-functions";
import { onDocumentWritten } from "firebase-functions/firestore";
import aiService from "../services/ai.service";
import dailyTargetsService from "../services/daily-targets.service";
import userService from "../services/user.service";

export const healthProfileWrittenTrigger = onDocumentWritten(
	{
		document: "users/{userId}/profiles/health-profile",
		memory: "1GiB",
		timeoutSeconds: 300,
		secrets: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const uid = event.params.userId;

		if (!snapshot) {
			logger.error("Health profile not found");
			return;
		}

		try {
			await dailyTargetsService.updateTargetsStatus(uid, "in-progress");

			const healthProfile = await userService.getHealthProfile(uid);
			if (!healthProfile) {
				logger.error("User has no health profile");
				return;
			}

			const targetsResult = await aiService.getDailyNutritionTargets(healthProfile);
			if (!targetsResult) {
				logger.error("Failed to get daily nutrition targets");
				return;
			}

			await dailyTargetsService.setDailyTargets(uid, targetsResult);
		} catch (error) {
			logger.error(`Error processing health profile for user ${uid}`, error);
			await dailyTargetsService.updateTargetsStatus(uid, "error");
		}
	}
);
