export interface FoundationFoodsEntity {
	foodClass: string;
	description: string;
	foodNutrients?: FoodNutrientsEntity[] | null;
	foodAttributes?: null[] | null;
	nutrientConversionFactors?: (NutrientConversionFactorsEntity | null)[] | null;
	isHistoricalReference: boolean;
	ndbNumber: number;
	dataType: string;
	foodCategory: FoodCategory;
	fdcId: number;
	foodPortions?: (FoodPortionsEntity | null)[] | null;
	publicationDate: string;
	inputFoods?: InputFoodsEntity[] | null;
	scientificName?: string | null;
}
export interface FoodNutrientsEntity {
	type: string;
	id: number;
	nutrient: Nutrient;
	dataPoints?: number | null;
	foodNutrientDerivation: FoodNutrientDerivation;
	median?: number | null;
	amount?: number | null;
	max?: number | null;
	min?: number | null;
	footnote?: string | null;
}
export interface Nutrient {
	id: number;
	number: string;
	name: string;
	rank: number;
	unitName: string;
}
export interface FoodNutrientDerivation {
	code?: string | null;
	description?: string | null;
	foodNutrientSource: FoodNutrientSource;
}
export interface FoodNutrientSource {
	id?: number | null;
	code?: string | null;
	description?: string | null;
}
export interface NutrientConversionFactorsEntity {
	type: string;
	proteinValue?: number | null;
	nitrogenValue?: number | null;
	fatValue?: number | null;
	carbohydrateValue?: number | null;
	value?: number | null;
}
export interface FoodCategory {
	description: string;
}
export interface FoodPortionsEntity {
	id: number;
	value: number;
	measureUnit: MeasureUnit;
	modifier?: string | null;
	gramWeight: number;
	sequenceNumber: number;
	amount: number;
	minYearAcquired: number;
	portionDescription?: string | null;
}
export interface MeasureUnit {
	id: number;
	name: string;
	abbreviation: string;
}
export interface InputFoodsEntity {
	id: number;
	foodDescription: string;
	inputFood: InputFood;
}
export interface InputFood {
	foodClass: string;
	description: string;
	dataType: string;
	foodCategory: FoodNutrientSourceOrFoodCategory;
	fdcId: number;
	publicationDate: string;
}
export interface FoodNutrientSourceOrFoodCategory {
	id: number;
	code: string;
	description: string;
}
