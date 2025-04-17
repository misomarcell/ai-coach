import { Nutrition, NutritionType, NutritionUnit } from "../models/food.model";

const CONVERSION_FACTORS: Record<NutritionUnit, number> = {
	"g": 1_000_000, // 1g = 1,000,000 µg
	"mg": 1_000, // 1mg = 1,000 µg
	"µg": 1, // Base unit for mass
	"kcal": 1, // No conversion (standalone)
	"IU": 1, // No conversion (standalone)
	"ml": 1, // Base unit for volume
	"%": 1 // No conversion (standalone)
};

const CONVERTIBLE_UNITS = {
	mass: ["g", "mg", "µg"] as NutritionUnit[],
	standalone: ["kcal", "IU", "ml", "%"] as NutritionUnit[]
};

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

export function toSmallestWholeUnit(nutrition: Nutrition): Nutrition {
	const { type, unit, amount } = nutrition;
	if (CONVERTIBLE_UNITS.standalone.includes(unit)) {
		const wholeAmount = Math.round(amount);

		return { type, unit, amount: wholeAmount };
	}

	if (CONVERTIBLE_UNITS.mass.includes(unit)) {
		const amountInMicrograms = amount * CONVERSION_FACTORS[unit];

		for (const targetUnit of CONVERTIBLE_UNITS.mass) {
			const amountInTargetUnit = amountInMicrograms / CONVERSION_FACTORS[targetUnit];
			if (!isNaN(amountInTargetUnit) && amountInTargetUnit > 1) {
				return { type, unit: targetUnit, amount: amountInTargetUnit };
			}
		}

		return { type, unit: "µg", amount: Math.round(amountInMicrograms) };
	}

	return { type, unit, amount: Math.round(amount) };
}
