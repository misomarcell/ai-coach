import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FoodCategory, Nutrition } from "./food.model";

export interface CalorieVisionResult {
	foodName: string;
	foodWeight: number;
	foodCalories: number;
	isValidFoodImage: boolean;
	foodCategory: FoodCategory;
	evaluation: VisionFoodEvaluation;
	nutritions: Nutrition[];
	mainIngredients: Ingredient[];
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
	NotFoodImage = "not-food-image",
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
