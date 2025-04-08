/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs";
import { FoodCategory, FoodDb, FoodStatus, Nutrition, ServingSize } from "@aicoach/shared";
import { FieldValue } from "firebase-admin/firestore";
import { addFoodsToDb, initFirestore } from "./import-base";
import { foodCategoryMap, nutritionMap } from "./usda.map";
import { FoodNutrientsEntity, FoodPortionsEntity, FoundationFoodsEntity } from "./usda.model";

async function main(isProd = true): Promise<void> {
	await initFirestore(isProd);

	if (isProd) {
		console.log("Are you sure you want to run this in production? (y/n)");
		const answer = await new Promise<string>((resolve) => {
			process.stdin.once("data", (data) => resolve(data.toString().trim()));
		});

		if (answer.toLowerCase() !== "y") {
			process.exit(0);
		}
	}

	const file = fs.readFileSync("./import-sources/usda.json", "utf-8");
	const data = JSON.parse(file);
	const entries: FoundationFoodsEntity[] = data.FoundationFoods;

	const convertedFoods = getConvertedFoods(entries);
	await addFoodsToDb(convertedFoods);

	// printAllNutritionTypes(entries);
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
