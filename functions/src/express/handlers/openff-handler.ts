import { FoodProduct } from "@aicoach/shared";
import { OpenFoodFacts } from "@openfoodfacts/openfoodfacts-nodejs";
import { Request, Response } from "express";
import { logger } from "firebase-functions";
import openffService from "../../services/openff.service";
import productImportService from "../../services/product-import.service";

const PRODUCT_CACHE: Record<string, FoodProduct> = {};

export async function handle(request: Request, response: Response): Promise<Response> {
	try {
		const barcode = request.params["barcode"];

		if (PRODUCT_CACHE[barcode]) {
			return response.status(200).json(PRODUCT_CACHE[barcode]);
		}

		const openFFProductMatch = await getExternalProduct(barcode);
		if (!openFFProductMatch) {
			return response.status(404).json({ error: "Product not found" });
		}

		PRODUCT_CACHE[barcode] = openFFProductMatch;

		await productImportService.createImportRequest(barcode, openFFProductMatch.lastUpdated || new Date());

		return response.status(200).json(openFFProductMatch);
	} catch (error) {
		logger.error("Error fetching product data:", error);
		return response.status(500).json({ error: "Internal server error" });
	}
}

async function getExternalProduct(barcode: string): Promise<FoodProduct | undefined> {
	const client = new OpenFoodFacts(fetch);
	const product = await client.getProduct(barcode);
	if (!product) {
		return undefined;
	}

	const food = openffService.getAsProduct(product);
	if (!food) {
		return undefined;
	}

	return food;
}
