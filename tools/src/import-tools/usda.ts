/* eslint-disable @typescript-eslint/no-unused-vars */
import { FoodCategory, FoodDb, FoodStatus, Nutrition, ServingSize } from "@aicoach/shared";
import { FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { FirestoreConnector } from "./import-base";
import { foodCategoryMap, nutritionMap } from "./usda.map";
import { FoodNutrientsEntity, FoodPortionsEntity, FoundationFoodsEntity } from "./usda.model";

var prompt = require("prompt-sync")();

async function main(): Promise<void> {
	const recordsInput = prompt("Number of records to import (blank = all): ");
	const envInput = prompt("Environment (prod / blank = dev): ") ?? "dev";
	const numberOfRecords = recordsInput ? parseInt(recordsInput, 10) : undefined;
	if (numberOfRecords !== undefined && isNaN(numberOfRecords)) {
		throw new Error("Invalid number entered. Please enter a valid number or leave blank.");
	}

	if (envInput && !["prod", "dev"].includes(envInput)) {
		throw new Error("Invalid environment entered. Please enter either 'prod', 'dev' or leave blank for dev.");
	}

	console.log(`Importing ${numberOfRecords ?? "All"} records to ${envInput || "DEV"} environment...`);

	const file = fs.readFileSync(path.resolve(__dirname, "./sources/usda.json"), "utf-8");
	const data = JSON.parse(file);
	const entries: FoundationFoodsEntity[] = data.FoundationFoods;

	const convertedFoods = getConvertedFoods(entries);

	const firestoreConnector = new FirestoreConnector(envInput === "prod");
	await firestoreConnector.addFoodsToDb(convertedFoods);
}

function getConvertedFoods(entries: FoundationFoodsEntity[]): Partial<FoodDb>[] {
	const foods: Partial<FoodDb>[] = entries.map((entry) => convertFood(entry));

	return foods;
}

/*
function printFoodData(entries: FoundationFoodsEntity[]) {
	for (let i = 0; i < entries.length; i++) {
		const foodName = entries[i].description;
		const description = entries[i].foodCategory.description;
		const ndb = entries[i].ndbNumber;
		const foodNutrients =
			entries[i].foodNutrients?.map((n) => `${n.nutrient.name} (${n.amount ?? n.median}${n.nutrient.unitName})`).join(", ") ||
			"No nutrients available";
		console.log(`${foodName} [${description}] [ndb. ${ndb}] | Nutrients: ${foodNutrients} \n`);
	}
}

function printAllCategories(entries: FoundationFoodsEntity[]) {
	const categories = new Set<string>();
	entries.forEach((entry) => {
		if (entry.foodCategory?.description) {
			categories.add(entry.foodCategory.description);
		}
	});

	console.log("Categories:", Array.from(categories));
}


function printAllNutritionTypes(entries: FoundationFoodsEntity[]) {
	const nutritionTypes = new Set<string>();
	entries.forEach((entry) => {
		entry.foodNutrients?.forEach((nutrient) => {
			if (nutrient.nutrient.name) {
				nutritionTypes.add(nutrient.nutrient.name);
			}
		});
	});

	console.log("Nutrition Types:", Array.from(nutritionTypes).join(", "));
}
*/

function convertFood(input: FoundationFoodsEntity): Partial<FoodDb> {
	const food: Partial<FoodDb> = {
		name: input.description,
		category: mapFoodCategory(input.foodCategory?.description),
		servingSizes: [],
		created: FieldValue.serverTimestamp(),
		lastUpdatedAt: FieldValue.serverTimestamp(),
		status: FoodStatus.Created,
		nutritions: [],
		isApproved: true,
		isPublic: true,
		ownerUid: "system",
		images: [],
		source: "USDA",
		variation: undefined,
		dietaryFlags: [],
		tags: []
	};

	const foodNutrients = mapNutrients(input.foodNutrients || []);
	for (const nutrition of foodNutrients) {
		const existingNutrition = food.nutritions?.find((n) => n.type === nutrition.type);
		if (existingNutrition && existingNutrition.amount !== nutrition.amount) {
			console.warn(`Already existing nutrition type found: ${nutrition.type} in food: ${food.name}`);
			console.warn("\t - Existing amount:", existingNutrition.amount);

			existingNutrition.amount += nutrition.amount;
			console.warn("\t - New amount:", existingNutrition.amount);
		} else {
			food.nutritions?.push(nutrition);
		}
	}

	food.servingSizes = mapServingSizes(input.foodPortions || []);

	return food;
}

function mapNutrients(sourceNutrients: FoodNutrientsEntity[]): Nutrition[] {
	const mappedNutrients: Nutrition[] = [];

	sourceNutrients.forEach((nutrient) => {
		const mapped = nutritionMap[nutrient.nutrient.name];
		if (mapped) {
			if (nutrient.nutrient.name === "Energy" && nutrient.nutrient.unitName === "kJ") {
				const kjAmount = nutrient.amount || nutrient.median || 0;
				const kcalAmount = kjAmount * 0.239; // Convert kJ to kcal
				mappedNutrients.push({
					type: "Calories",
					unit: "kcal",
					amount: kcalAmount
				});
			} else if (mapped.unit === nutrient.nutrient.unitName) {
				mappedNutrients.push({
					type: mapped.type,
					unit: mapped.unit,
					amount: nutrient.amount || nutrient.median || 0
				});
			} else {
				console.warn(
					`Unit mismatch for nutrient ${nutrient.nutrient.name}: expected ${mapped.unit}, got ${nutrient.nutrient.unitName}`
				);
			}
		}
	});

	return mappedNutrients;
}

function mapServingSizes(sourcePortions: (FoodPortionsEntity | null)[]): ServingSize[] {
	const mappedServingSizes: ServingSize[] = [
		{
			name: "g",
			gramWeight: 1
		}
	];

	if (!sourcePortions || sourcePortions.length === 0) {
		return mappedServingSizes;
	}

	for (let i = 0; i < sourcePortions.length; i++) {
		const portion = sourcePortions[i];
		if (!portion || !portion.gramWeight || !portion.measureUnit?.abbreviation) {
			continue;
		}

		if (portion.amount !== 1 && portion.measureUnit.abbreviation !== "ml") {
			console.warn(`Portion amount is not 1 for ${portion.measureUnit.abbreviation}: ${portion.amount}`);
		}

		const servingName = portion.portionDescription
			? `${portion.measureUnit.abbreviation} (${portion.portionDescription})`
			: portion.measureUnit.abbreviation;

		const servingSize: ServingSize = {
			name: servingName,
			gramWeight: portion.gramWeight
		};
		mappedServingSizes.push(servingSize);
	}

	return mappedServingSizes;
}

function mapFoodCategory(value?: string): FoodCategory {
	return foodCategoryMap[value || ""] || "Other";
}

(async () => main())();
