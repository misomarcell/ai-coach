/* eslint-disable @typescript-eslint/no-explicit-any */
import { FoodCategory, FoodDb, FoodStatus, Nutrition, NutritionType } from "@aicoach/shared";
import { FieldValue } from "firebase-admin/firestore";
import path from "path";
import { readFile, utils } from "xlsx";
import { xlsHeaders, xlsToFoodCategoryMap, xlsToNutritionMap } from "./ciqual.model";
import { FirestoreConnector } from "./import-base";
import { getAssumedFlags } from "./import-utils";
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

	const file = readFile(path.resolve(__dirname, "./sources/ciqual.xls"));
	const sheetName = file.SheetNames[0];
	const sheet = file.Sheets[sheetName];
	const data = utils.sheet_to_json(sheet, { header: xlsHeaders, defval: null });

	const dataToImport = numberOfRecords ? data.slice(0, numberOfRecords) : data.slice(1);
	const foods = dataToImport.map((row: any) => convertRowsToFoods(row)).filter((food) => !!food && !!getNutritionValue(food, "Calories"));

	console.log(`Total of ${foods.length} converted foods to be saved...`);

	const firestoreConnector = new FirestoreConnector(envInput === "prod");
	await firestoreConnector.addFoodsToDb(foods);
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
		dietaryFlags: getAssumedFlags(mappedCategory),
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
		if (!value || value === "" || value === "-" || value === "traces") {
			// console.log(`Value is empty or invalid for header: ${header}. Skipping...`);
			continue;
		} else if (value.startsWith("< ")) {
			value = parseFloat(value.replace("< ", "").replace(",", "."));
		} else {
			value = parseFloat(value.replace(",", "."));
		}

		if (isNaN(value)) {
			console.warn(`Parsed value is NaN (${row[header]?.trim()}) for header: ${header}. Skipping...`);
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
