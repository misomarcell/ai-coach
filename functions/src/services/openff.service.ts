import { DietaryFlag, FoodProduct, NutrientTag, Nutrition, ServingSize } from "@aicoach/shared";
import { ProductV2 } from "@openfoodfacts/openfoodfacts-nodejs";
import {
	openFoodFactsToDietaryFlagMapping,
	openFoodFactsToNutrientTagMapping,
	openFoodFactsToNutritionMapping
} from "../const/openff-mapping.const";

export class OpenFFService {
	getAsProduct(openffProduct: ProductV2): FoodProduct {
		const food: FoodProduct = {
			name: openffProduct.product_name_en || openffProduct.product_name,
			brand: openffProduct.brands,
			barcode: openffProduct.code,
			nutriScoreGrade: openffProduct.nutriscore_grade,
			nutritions: this.convertToNutrition(openffProduct.nutriments),
			nutrientTags: this.convertToNutrientTags(openffProduct.nutrient_levels_tags),
			dietaryFlags: this.convertToDietaryFlags(openffProduct.ingredients_analysis_tags),
			servingSizes: this.convertServingSizes(openffProduct),
			lastUpdated: this.getLastUpdatedDate(openffProduct),
			images: [{ url: openffProduct.image_url, type: "package" }]
		};

		return food;
	}

	convertToDietaryFlags(ingredientsAnalysisTags: string[]): DietaryFlag[] {
		if (!ingredientsAnalysisTags || ingredientsAnalysisTags.length === 0) {
			return [];
		}

		return ingredientsAnalysisTags
			.map((tag) => openFoodFactsToDietaryFlagMapping[tag])
			.filter((flag): flag is DietaryFlag => flag !== undefined);
	}

	convertToNutrientTags(nutrientLevels: string[]): NutrientTag[] {
		if (!nutrientLevels || nutrientLevels.length === 0) {
			return [];
		}

		return nutrientLevels.map((tag) => openFoodFactsToNutrientTagMapping[tag]).filter((tag): tag is NutrientTag => tag !== undefined);
	}

	convertServingSizes(openffProduct: ProductV2): ServingSize[] {
		const defaultServingSize: ServingSize = { name: "g", gramWeight: 1, isAiEstimate: false };
		if (openffProduct && openffProduct.serving_size) {
			return [
				{
					name: "Serving",
					gramWeight: this.normalizeServingWeight(openffProduct.serving_size),
					isAiEstimate: false
				},
				defaultServingSize
			];
		}

		return [defaultServingSize, { name: "100g", gramWeight: 100, isAiEstimate: false }];
	}

	normalizeServingWeight(input: string): number {
		const servingWeight = parseFloat(input);
		if (isNaN(servingWeight)) {
			throw new Error(`Invalid serving weight: ${input}`);
		}

		return servingWeight % 1 === 0 ? Math.floor(servingWeight) : servingWeight;
	}

	convertToNutrition(nutriments: { [key: string]: number }): Nutrition[] {
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

	getLastUpdatedDate(openffProduct: ProductV2): Date | undefined {
		if (openffProduct && openffProduct.last_modified_t) {
			return new Date(openffProduct.last_modified_t * 1000);
		}
		return undefined;
	}
}

export default new OpenFFService();
