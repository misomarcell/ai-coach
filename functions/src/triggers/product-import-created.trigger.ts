import { FoodDb, FoodStatus } from "@aicoach/shared";
import OpenFoodFacts, { ProductV2 } from "@openfoodfacts/openfoodfacts-nodejs";
import { firestore } from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/firestore";
import { ProductImport } from "../models/product-import.model";
import foodService from "../services/food.service";
import openffService from "../services/openff.service";

export const productImportCreated = onDocumentCreated(
	{
		document: "product-imports/{importId}",
		memory: "1GiB",
		timeoutSeconds: 300,
		region: "europe-west1"
	},
	async (event) => {
		const importData = event.data?.data() as ProductImport;
		if (!importData) {
			logger.warn(`No import data found for document: ${event.data?.id}`);

			return null;
		}

		const barcode = importData.code;
		const product = await getExternalProduct(barcode);
		if (!product) {
			logger.warn(`Product not found for barcode: ${barcode}`);
			return null;
		}

		try {
			const existingFood = await foodService.getFoodByBarcode(barcode);
			const importFood = getAsFood(product);
			if (!existingFood) {
				const documentId = await foodService.createFoodDocument(importFood);
				await firestore()
					.doc(`product-imports/${event.data?.id}`)
					.set({ status: "imported" } as ProductImport);
				logger.info(`Created new food document for barcode: ${barcode} with ID: ${documentId}`);

				return;
			}

			const importFoodLastUpdated = (importData.lastUpdatedAt as Timestamp)?.toDate();
			const existinFoodCreated = (existingFood.created as Timestamp)?.toDate();
			const existingFoodLastUpdated = (existingFood.lastUpdatedAt as Timestamp)?.toDate();
			if (importFoodLastUpdated && existinFoodCreated && existingFoodLastUpdated) {
				if (importFoodLastUpdated > existinFoodCreated && importFoodLastUpdated > existingFoodLastUpdated) {
					await foodService.updateFoodDocument(existingFood.id, importFood);
					await firestore()
						.doc(`product-imports/${event.data?.id}`)
						.set({ status: "updated" } as ProductImport);
					logger.info(`Updated existing food document for barcode: ${barcode} with ID: ${existingFood.id}`);
				} else {
					firestore().doc(`product-imports/${event.data?.id}`).delete();
					logger.info(`Dismissed import request for barcode: ${barcode} as it is outdated`);
				}
			} else {
				logger.error(`Invalid timestamps for barcode: ${barcode}`);
			}

			return;
		} catch (error) {
			logger.error(`Error processing product import for barcode: ${barcode}`, error);
			await firestore()
				.doc(`product-imports/${event.data?.id}`)
				.set({ status: "failed", error } as ProductImport);
		}
	}
);

async function getExternalProduct(barcode: string): Promise<ProductV2> {
	const client = new OpenFoodFacts(fetch);
	return client.getProduct(barcode);
}

function getAsFood(product: ProductV2): FoodDb {
	const food: FoodDb = {
		id: "",
		name: product.product_name_en || product.product_name,
		brand: product.brands,
		barcode: product.code,
		nutritions: openffService.convertToNutrition(product.nutriments),
		nutrientTags: openffService.convertToNutrientTags(product.nutrient_levels_tags),
		dietaryFlags: openffService.convertToDietaryFlags(product.ingredients_analysis_tags),
		servingSizes: openffService.convertServingSizes(product),
		images: [{ url: product.image_url, type: "package" }],
		created: FieldValue.serverTimestamp(),
		lastUpdatedAt: FieldValue.serverTimestamp(),
		category: "Other",
		ownerUid: "system",
		status: FoodStatus.Created,
		isPublic: true,
		isApproved: true,
		counters: {
			added: 1
		}
	};

	return food;
}
