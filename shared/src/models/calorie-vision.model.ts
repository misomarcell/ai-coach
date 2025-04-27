import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FoodCategory } from "./food.model";

export interface NutritionalInfo {
	totalCalories: number;
	totalFat: number;
	totalSaturatedFat: number;
	totalCarbs: number;
	totalSugars: number;
	totalFiber: number;
	totalProtein: number;
	totalSalt: number;
	mainIngredients: Ingredient[];
}

export interface CalorieVisionResult {
	foodName: string;
	foodWeight: number;
	isValidFoodImage: boolean;
	evaluation: VisionFoodEvaluation;
	foodCategory: FoodCategory;
	nutitionalInfo: NutritionalInfo;
}

export interface VisionFoodEvaluation {
	score: number;
	description: string;
}

export interface Ingredient {
	name: string;
	calories: number;
	gramWeight: number;
}

export enum CalorieVisionStatus {
	Created = "created",
	Submitted = "submitted",
	Processing = "processing",
	Complete = "complete",
	Error = "error"
}

export interface CalorieVision {
	id: string;
	fileName: string;
	status: CalorieVisionStatus;
	imageDescription?: string;
	created: Date;
	result: CalorieVisionResult;
}

export interface CalorieVisionDb extends Omit<CalorieVision, "created"> {
	created: FieldValue | Timestamp;
}
