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
		const userId = event.params.userId;

		if (!snapshot) {
			logger.error("Health profile not found");
			return;
		}

		await dailyTargetsService.updateTargetsStatus(userId, "in-progress");

		try {
			const healthProfile = await userService.getHealthProfile(userId);
			if (!healthProfile) {
				logger.error("User has no health profile");
				return;
			}

			logger.info("❤️ Health profile found. Proceeding...");

			const targetsResult = await aiService.getDailyNutritionTargets(healthProfile);
			if (!targetsResult) {
				logger.error("Failed to get daily nutrition targets");
				return;
			}

			logger.info(`✅ Daily nutrition (${targetsResult.nutritons.length}) targets retrieved successfully. Proceeding...`);

			await dailyTargetsService.setDailyTargets(userId, targetsResult);
		} catch (error) {
			await dailyTargetsService.updateTargetsStatus(userId, "error");
		}
	}
);
