import { FoodDb, FoodStatus, FoodType } from "@aicoach/shared";
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
		const barcode = importData.code;

		if (!event.data || !importData) {
			logger.warn(`No import data found for document: ${event.data?.id}`);

			return null;
		}

		try {
			const product = await getExternalProduct(barcode);
			if (!product) {
				throw new Error(`External product not found for barcode: ${barcode}`);
			}

			const existingFood = await foodService.getFoodByBarcode(barcode);
			const importFood = getAsFood(product);
			if (!existingFood) {
				const documentId = await foodService.createFoodDocument(importFood);
				logger.info(`Created new food document for barcode: ${barcode} with ID: ${documentId}`);

				return await updateImportRequest(event.data.id, "imported", null);
			}

			const importFoodLastUpdated = (importData.lastUpdatedAt as Timestamp)?.toDate();
			const existinFoodCreated = (existingFood.created as Timestamp)?.toDate();
			const existingFoodLastUpdated = (existingFood.lastUpdatedAt as Timestamp)?.toDate();
			if (importFoodLastUpdated && existinFoodCreated && existingFoodLastUpdated) {
				if (importFoodLastUpdated > existinFoodCreated && importFoodLastUpdated > existingFoodLastUpdated) {
					logger.info(`Updated existing food document for barcode: ${barcode} with ID: ${existingFood.id}`);
					await foodService.updateFoodDocument(existingFood.id, importFood);

					return await updateImportRequest(event.data.id, "updated", null);
				} else {
					return await deleteImportRequest(event.data?.id);
				}
			}

			throw new Error("Invalid date comparison for food documents");
		} catch (error) {
			logger.error(`Error processing product import for barcode: ${barcode}`, error);
			if (error instanceof Error) {
				return await updateImportRequest(event.data.id, "failed", error.message);
			} else {
				return await updateImportRequest(event.data.id, "failed", JSON.stringify(error));
			}
		}
	}
);

async function updateImportRequest(id: string, status: string, error?: unknown): Promise<void> {
	try {
		const importRequestRef = firestore().collection("product-imports").doc(id);
		await importRequestRef.set({ status, error }, { merge: true });
	} catch (error) {
		logger.error(`Error updating import request with ID: ${id}`, error);
	}
}

async function deleteImportRequest(id: string): Promise<void> {
	try {
		const importRequestRef = firestore().collection("product-imports").doc(id);
		await importRequestRef.delete();
	} catch (error) {
		logger.error(`Error deleting import request with ID: ${id}`, error);
	}
}

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
		type: FoodType.Product,
		nutritions: openffService.convertToNutrition(product.nutriments),
		nutrientTags: openffService.convertToNutrientTags(product.nutrient_levels_tags),
		dietaryFlags: openffService.convertToDietaryFlags(product.ingredients_analysis_tags),
		servingSizes: openffService.convertServingSizes(product),
		images: [{ url: product.image_url, type: "package" }],
		created: FieldValue.serverTimestamp(),
		lastUpdatedAt: FieldValue.serverTimestamp(),
		category: "Unknown", // TODO: Create category mapper
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
