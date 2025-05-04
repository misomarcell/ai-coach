import { DietaryFlag, FoodProduct, NutrientTag, Nutrition } from "@aicoach/shared";
import OpenFoodFacts, { ProductV2 } from "@openfoodfacts/openfoodfacts-nodejs";
import { Request, Response } from "express";
import {
	openFoodFactsToDietaryFlagMapping,
	openFoodFactsToNutrientTagMapping,
	openFoodFactsToNutritionMapping
} from "../../const/openff-mapping.const";

export async function handle(request: Request, response: Response): Promise<Response> {
	const client = new OpenFoodFacts(fetch, { country: "en" });
	const barcode = request.params["barcode"];

	const product = await client.getProduct(barcode);
	if (!product) {
		return response.status(404).json({ error: "Product not found" });
	}

	const openFFProductMatch = await getExternalProduct(barcode);

	return response.status(200).json(openFFProductMatch);
}

async function getExternalProduct(barcode: string): Promise<FoodProduct | undefined> {
	const client = new OpenFoodFacts(fetch);
	const product = await client.getProduct(barcode);
	if (!product) {
		return undefined;
	}

	const food = convertProduct(product);
	if (!food) {
		return undefined;
	}

	return food;
}

function convertProduct(openffProduct: ProductV2): FoodProduct {
	const food: FoodProduct = {
		name: openffProduct.product_name_en || openffProduct.product_name,
		brand: openffProduct.brands,
		barcode: openffProduct.code,
		nutritions: convertToNutrition(openffProduct.nutriments),
		nutrientTags: convertToNutrientTags(openffProduct.nutrient_levels_tags),
		dietaryFlags: convertToDietaryFlags(openffProduct.ingredients_analysis_tags),
		images: [{ url: openffProduct.image_url, type: "package" }]
	};

	return food;
}

function convertToDietaryFlags(ingredientsAnalysisTags: string[]): DietaryFlag[] {
	if (!ingredientsAnalysisTags || ingredientsAnalysisTags.length === 0) {
		return [];
	}

	return ingredientsAnalysisTags
		.map((tag) => openFoodFactsToDietaryFlagMapping[tag])
		.filter((flag): flag is DietaryFlag => flag !== undefined);
}

function convertToNutrientTags(nutrientLevels: string[]): NutrientTag[] {
	if (!nutrientLevels || nutrientLevels.length === 0) {
		return [];
	}

	return nutrientLevels.map((tag) => openFoodFactsToNutrientTagMapping[tag]).filter((tag): tag is NutrientTag => tag !== undefined);
}

function convertToNutrition(nutriments: { [key: string]: number }): Nutrition[] {
	if (!nutriments || Object.keys(nutriments).length === 0) {
		return [];
	}

	return Object.entries(nutriments)
		.map(([key, amount]) => {
			const mapping = openFoodFactsToNutritionMapping[key];
			if (mapping) {
				return {
					type: mapping.type,
					unit: mapping.unit,
					amount
				};
			}

			return null;
		})
		.filter((nutrition): nutrition is Nutrition => nutrition !== null);
}
