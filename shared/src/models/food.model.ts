import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const nutritionTypes = [
	"Calories",
	"Total Fat",
	"Saturated Fat",
	"Monounsaturated Fat",
	"Polyunsaturated Fat",
	"Trans Fat",
	"Omega-3 Total",
	"Omega-3 ALA",
	"Omega-3 EPA",
	"Omega-3 DHA",
	"Omega-3 DPA",
	"Omega-3 ETE",
	"Omega-6 Total",
	"Omega-6 LA",
	"Omega-6 DGLA",
	"Carbohydrates",
	"Sugar",
	"Fiber",
	"Starch",
	"Protein",
	"Cystine",
	"Histidine",
	"Isoleucine",
	"Leucine",
	"Lysine",
	"Methionine",
	"Phenylalanine",
	"Threonine",
	"Tryptophan",
	"Tyrosine",
	"Valine",
	"Sodium",
	"Salt",
	"Alcohol",
	"Water",
	"Caffeine",
	"Vitamin A Total",
	"Vitamin A RAE",
	"Vitamin A Retinol",
	"Vitamin A Beta-Carotene",
	"Vitamin C",
	"Vitamin D",
	"Vitamin E",
	"Vitamin K",
	"Vitamin B-6",
	"Vitamin B-12",
	"Thiamin",
	"Riboflavin",
	"Niacin",
	"Pantothenic Acid",
	"Folate",
	"Fructose",
	"Galactose",
	"Glucose",
	"Lactose",
	"Maltose",
	"Sucrose",
	"Biotin",
	"Choline",
	"Iodine",
	"Zinc",
	"Calcium",
	"Copper",
	"Iron",
	"Magnesium",
	"Manganese",
	"Phosphorus",
	"Potassium",
	"Selenium",
	"Cholesterol"
] as const;
export type NutritionType = (typeof nutritionTypes)[number];

export const foodCategories = [
	"Baby Foods",
	"Baked Products",
	"Fruits",
	"Fish",
	"Vegetables",
	"Grains & Cereals",
	"Restaurant Foods",
	"Proteins",
	"Dairy & Alternatives",
	"Legumes & Pulses",
	"Nuts & Seeds",
	"Fats & Oils",
	"Sweets & Desserts",
	"Beverages",
	"Soups and Sauces",
	"Spices and Herbs",
	"Snacks & Processed Foods",
	"Supplements",
	"Mixed Dishes",
	"Other"
] as const;
export type FoodCategory = (typeof foodCategories)[number];

export const nutritionUnits = ["kcal", "g", "mg", "µg", "IU", "ml", "%"] as const;
export type NutritionUnit = (typeof nutritionUnits)[number];

export enum FoodStatus {
	Analyzing = "analyzing",
	Creating = "creating",
	Prefilled = "prefilled",
	Created = "created",
	Deleted = "deleted",
	Invalid = "invalid"
}

export const dietaryFlags = ["vegan", "vegetarian", "gluten-free", "keto"] as const;
export type DietaryFlag = (typeof dietaryFlags)[number];

export interface Nutrition {
	type: NutritionType;
	unit: NutritionUnit;
	amount: number;
}

export interface ServingSize {
	name: string;
	gramWeight: number;
}

export interface ProductImage {
	url: string;
	type: "package" | "label";
}

export type FoodCounters = {
	added: number;
};

export interface Food {
	id: string;
	name: string;
	brand?: string;
	barcode: string;
	category: FoodCategory;
	nutritions: Nutrition[];
	servingSizes: ServingSize[];
	created: Date;
	status: FoodStatus;
	isApproved: boolean;
	isPublic: boolean;
	ownerUid: string;
	lastUpdatedAt?: Date;
	images: ProductImage[];
	counters: FoodCounters;
	source?: string;
	variation?: string;
	dietaryFlags?: DietaryFlag[];
	tags?: string[];
}

export interface FoodDb extends Omit<Food, "created" | "lastUpdatedAt"> {
	created: FieldValue | Timestamp;
	lastUpdatedAt?: FieldValue | Timestamp;
}
