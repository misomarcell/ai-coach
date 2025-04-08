import { FieldValue, Timestamp } from "firebase-admin/firestore";

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
	nutitionalInfo: NutritionalInfo;
}

export interface Ingredient {
	name: string;
	calories: number;
	weight: number;
}

export enum CalorieVisionStatus {
	Processing = "processing",
	Complete = "complete",
	Error = "error"
}

export interface CalorieVision {
	id: string;
	fileName: string;
	status: CalorieVisionStatus;
	description?: string;
	created: Date;
	result: CalorieVisionResult;
}

export interface CalorieVisionDb extends Omit<CalorieVision, "created"> {
	created: FieldValue | Timestamp;
}
