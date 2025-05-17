import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { DietaryFlag, Food, ProductImage, ServingSize } from "./food.model";

export type ServingFood = Pick<
	Food,
	"name" | "brand" | "type" | "category" | "source" | "isApproved" | "tags" | "nutrientTags" | "nutritions" | "barcode"
> & {
	id?: string;
	images?: ProductImage[];
	servingSizes?: ServingSize[];
	dietaryFlags?: DietaryFlag[];
};
export const servingCategories = ["Breakfast", "Snacks", "Lunch", "Dinner", "Uncategorized"] as const;
export type ServingCategory = (typeof servingCategories)[number];

export interface Serving {
	id: string;
	created: Date;
	lastUpdatedAt?: Date;
	category: ServingCategory;
	food: ServingFood;
	servingAmount: number;
	servingSize: ServingSize;
	isFinalized: boolean;
	isEditable?: boolean;
	isCalorieVision?: boolean;
	comment?: string;
}

export interface ServingDb extends Omit<Serving, "created" | "lastUpdatedAt"> {
	created: FieldValue | Timestamp;
	lastUpdatedAt?: FieldValue | Timestamp;
}
