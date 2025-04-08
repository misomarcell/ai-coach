/* eslint-disable @typescript-eslint/no-explicit-any */
import { FoodCategory, FoodDb, FoodStatus, Nutrition, NutritionType } from "@aicoach/shared";
import { FieldValue } from "firebase-admin/firestore";
import { readFile, utils } from "xlsx";
import { xlsHeaders, xlsToFoodCategoryMap, xlsToNutritionMap } from "./ciqual.model";
import { addFoodsToDb, initFirestore } from "./import-base";

async function main(): Promise<void> {
	const file = readFile("./import-sources/ciqual.xls");
	const sheetName = file.SheetNames[0];
	const sheet = file.Sheets[sheetName];
	const data = utils.sheet_to_json(sheet, { header: xlsHeaders, defval: null });

	const foods = data
		.slice(1)
		.map((row: any) => convertRowsToFoods(row))
		.filter((food) => !!food && !!getNutritionValue(food, "Calories"));

	console.log(`Total of ${foods.length} foods to be added...`);

	await initFirestore(true);
	await addFoodsToDb(foods);
}

function getNutritionValue(food: Partial<FoodDb>, type: NutritionType): number | undefined {
	const nutrition = food.nutritions?.find((n) => n.type === type);
	return nutrition ? parseFloat(nutrition.amount.toString()) : undefined;
}

function convertRowsToFoods(row: any): Partial<FoodDb> {
	const foodName = row["alim_nom_eng"];
	const foodCategory = row["alim_ssgrp_nom_eng"];
	const mappedCategory = mapXlsCategoryToFoodCategory(foodCategory);

	return {
		name: foodName,
		category: mappedCategory,
		isApproved: true,
		isPublic: true,
		ownerUid: "system",
		source: "CIQUAL",
		created: FieldValue.serverTimestamp(),
		lastUpdatedAt: FieldValue.serverTimestamp(),
		status: FoodStatus.Created,
		nutritions: mapXlsToNutritions(row),
		servingSizes: [{ name: "g", gramWeight: 1 }],
		dietaryFlags: [],
		tags: []
	};
}

function mapXlsCategoryToFoodCategory(xlsCategory: string): FoodCategory {
	return xlsToFoodCategoryMap[xlsCategory] || "Other"; // Fallback to "Other" if not found
}

function mapXlsToNutritions(row: any): Nutrition[] {
	const nutritions: Nutrition[] = [];
	for (const header of Object.keys(row)) {
		const mappedNutrition = xlsToNutritionMap[header];
		if (!mappedNutrition) {
			// console.warn(`No mapping found for header: ${header}. Skipping...`);
			continue;
		}

		if (!header.includes("/100g")) {
			console.log(`Header ${header} does not contain "g/100g". Skipping...`);
			continue;
		}

		let value = row[header]?.trim();
		if (!value || value === "" || value === "-") {
			// console.log(`Value is empty or invalid for header: ${header}. Skipping...`);
			continue;
		} else if (value.startsWith("< ")) {
			value = parseFloat(value.replace("< ", "").replace(",", "."));
		} else {
			value = parseFloat(value.replace(",", "."));
		}

		if (isNaN(value)) {
			console.warn(`Parsed value is NaN for header: ${header}. Skipping...`);
			continue;
		}

		nutritions.push({
			type: mappedNutrition.type,
			unit: mappedNutrition.unit,
			amount: value
		});
	}

	return nutritions;
}

(async () => main())();
