import { ServingDb } from "@aicoach/shared";
import { logger } from "firebase-functions";
import { onDocumentDeleted } from "firebase-functions/firestore";
import foodService from "../services/food.service";

export const servingDeletedTrigger = onDocumentDeleted(
	{
		document: "users/{userId}/servings/{servingId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const snapshot = event.data;
		const serving = snapshot?.data() as ServingDb | undefined;
		if (!serving) {
			logger.error("Serving not found, food counter couldn't be decreased.");

			return;
		}

		const foodId = serving?.food.id;
		if (!foodId) {
			logger.log("Food ID not found, food counter couldn't be decreased.");

			return;
		}

		await foodService.decreaseAddedCounter(foodId);
		logger.log(`Food counter decreased for food ID: ${foodId}`);
	}
);
