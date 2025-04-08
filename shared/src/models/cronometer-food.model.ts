import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const enum CronometerFoodRequestStatus {
	Processing = "processing",
	Complete = "complete",
	Error = "error"
}

export interface CronometerFoodRequest {
	created: Date;
	food: CronometerFood;
	status: CronometerFoodRequestStatus;
}

export interface CronometerFoodRequestDb extends Omit<CronometerFoodRequest, "created"> {
	created: FieldValue | Timestamp;
}

export interface CronometerFoodIngredient {
	name: string;
	amount: number;
}

export interface CronometerFoodNutrition {
	name: string;
	amount: string | number;
	unit: string;
}

export interface CronometerFood {
	name: string;
	ingredients: CronometerFoodIngredient[];
	nutritions: CronometerFoodNutrition[];
}
