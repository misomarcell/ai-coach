import { ServingDb } from "@aicoach/shared";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/firestore";
import aiService from "../services/ai.service";
import dailyTargetsService from "../services/daily-targets.service";
import userService from "../services/user.service";

export const servingCreatedTrigger = onDocumentCreated(
	{
		document: "users/{userId}/servings/{servingId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		secrets: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const userId = event.params.userId;

		if (!snapshot) {
			logger.error("Serving data not found");
			return;
		}

		const servingData = snapshot.data() as ServingDb;
		const servingDate = (servingData.created as Timestamp)?.toDate() || new Date();
		logger.info(`📅 serving date: ${servingDate}`);

		const dailyTargets = await dailyTargetsService.getDailyTagets(userId, servingDate);
		if (dailyTargets) {
			logger.info("⛔ Daily targets already exist, skipping...");

			return;
		}

		logger.info("🎯 No daily targets found, proceeding...");

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
		logger.info(targetsResult);

		await dailyTargetsService.setDailyTargets(userId, servingDate, targetsResult);
	}
);
