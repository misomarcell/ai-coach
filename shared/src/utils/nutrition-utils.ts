import { Nutrition, NutritionType } from "../models/food.model";

function getNutritionAmount(nutritions: Nutrition[], type: NutritionType): number {
	return nutritions.find((n) => n.type === type)?.amount || 0;
}

export function calculateNetCarbs(nutritions: Nutrition[]): number {
	const carbs = getNutritionAmount(nutritions, "Carbohydrates");
	const fiber = getNutritionAmount(nutritions, "Fiber");

	return carbs - fiber;
}

export function calculateOmega3Total(nutritions: Nutrition[]): number {
	const omega3Types: NutritionType[] = ["Omega-3 ALA", "Omega-3 EPA", "Omega-3 DHA", "Omega-3 DPA", "Omega-3 ETE"];

	return omega3Types.reduce((total, type) => total + getNutritionAmount(nutritions, type), 0);
}

export function calculateOmega6Total(nutritions: Nutrition[]): number {
	const omega6Types: NutritionType[] = ["Omega-6 LA", "Omega-6 DGLA"];

	return omega6Types.reduce((total, type) => total + getNutritionAmount(nutritions, type), 0);
}
