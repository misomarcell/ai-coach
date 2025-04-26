import { ServingDb } from "@aicoach/shared";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/firestore";
import foodService from "../services/food.service";

export const servingCreatedTrigger = onDocumentCreated(
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
			logger.error("Serving not found, food counter couldn't be increased.");

			return;
		}

		const foodId = serving?.food.id;
		if (!foodId) {
			logger.log("Food ID not found, food counter couldn't be increased.");

			return;
		}

		await foodService.increaseAddedCounter(foodId);
		logger.log(`Food counter increased for food ID: ${foodId}`);
	}
);
