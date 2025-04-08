import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DietaryFlag, Food, ServingSize } from "./food.model";

export type ServingFood = Pick<Food, "name" | "brand" | "category" | "isApproved" | "tags" | "nutritions"> & {
	dietaryFlags?: DietaryFlag[];
	foodId?: string;
};
export const servingCategories = ["Breakfast", "Snacks", "Lunch", "Dinner", "Uncategorized"] as const;
export type ServingCategory = (typeof servingCategories)[number];

export interface Serving {
	id: string;
	created: Date;
	lastUpdatedAt?: Date;
	category: ServingCategory;
	food: ServingFood;
	servingSize: ServingSize;
	isCustomized: boolean;
	comment?: string;
}

export interface ServingDb extends Omit<Serving, "created" | "lastUpdatedAt"> {
	created: FieldValue | Timestamp;
	lastUpdatedAt?: FieldValue | Timestamp;
}
