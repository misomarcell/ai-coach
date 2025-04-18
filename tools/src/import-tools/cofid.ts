/* eslint-disable @typescript-eslint/no-explicit-any */
import { FoodCategory, FoodDb, FoodStatus, Nutrition, NutritionType } from "@aicoach/shared";
import { FieldValue } from "firebase-admin/firestore";
import { readFile, utils } from "xlsx";
import { xlsHeaders, xlsToFoodCategoryMap, xlsToNutritionMap } from "./cofid.model";
import { FirestoreConnector } from "./import-base";
import path from "path";
var prompt = require("prompt-sync")();

function printAllNutritionTypes(data: any[]): void {
	const uniqueColumns = new Set<string>();
	data.forEach((row) => {
		Object.keys(row).forEach((key) => {
			uniqueColumns.add(key);
		});
	});
	console.log("All columns in the dataset:");
	console.log(Array.from(uniqueColumns).sort().join("\n"));
}

function printAllFoodGroups(data: any[]): void {
	const foodGroups = new Set<string>();
	data.forEach((row) => {
		if (row["Food Group"]) {
			foodGroups.add(row["Food Group"]);
		}
	});
	console.log("All food groups in the dataset:");
	console.log(Array.from(foodGroups).sort().join("\n"));
}

async function main(): Promise<void> {
	const recordsInput = prompt("Number of records to import (blank = all): ");
	const envInput = prompt("Environment (prod / blank = dev): ") ?? "dev";
	const debugFlag = prompt("Debug mode? (y/n, blank = n): ") ?? "n";
	const debug = debugFlag.toLowerCase() === "y";

	const numberOfRecords = recordsInput ? parseInt(recordsInput, 10) : undefined;
	if (numberOfRecords !== undefined && isNaN(numberOfRecords)) {
		throw new Error("Invalid number entered. Please enter a valid number or leave blank.");
	}

	if (envInput && !["prod", "dev"].includes(envInput)) {
		throw new Error("Invalid environment entered. Please enter either 'prod', 'dev' or leave blank for dev.");
	}

	console.log(`Importing ${numberOfRecords ?? "All"} records to ${envInput || "DEV"} environment...`);

	const file = readFile(path.resolve(__dirname, "./sources/cofid.xlsx"));
	const sheetName = file.SheetNames[3];
	const sheet = file.Sheets[sheetName];
	const data = utils.sheet_to_json(sheet, { header: xlsHeaders, defval: null });

	if (debug) {
		printAllNutritionTypes(data);
		printAllFoodGroups(data);
		console.log(`Total rows found: ${data.length}`);
	}

	const dataToImport = numberOfRecords ? data.slice(0, numberOfRecords) : data;
	const foods = dataToImport.map((row: any) => convertRowToFood(row)).filter((food) => !!food && !!getNutritionValue(food, "Calories"));
	console.log(`Total of ${foods.length} converted foods to be saved...`);

	const firestoreConnector = new FirestoreConnector(envInput === "prod");
	await firestoreConnector.addFoodsToDb(foods);
}

function getNutritionValue(food: Partial<FoodDb>, type: NutritionType): number | undefined {
	const nutrition = food.nutritions?.find((n) => n.type === type);
	return nutrition ? parseFloat(nutrition.amount.toString()) : undefined;
}

function convertRowToFood(row: any): Partial<FoodDb> {
	const foodName = row["Food Name"];
	const foodGroup = row["Group"];

	if (!foodName) {
		return {};
	}

	const mappedCategory = mapFoodGroupToCategory(foodGroup);

	return {
		name: foodName,
		category: mappedCategory,
		isApproved: true,
		isPublic: true,
		ownerUid: "system",
		source: "CoFID",
		created: FieldValue.serverTimestamp(),
		lastUpdatedAt: FieldValue.serverTimestamp(),
		status: FoodStatus.Created,
		nutritions: mapRowToNutritions(row),
		servingSizes: [{ name: "g", gramWeight: 1 }],
		dietaryFlags: [],
		tags: []
	};
}

function mapFoodGroupToCategory(foodGroup: string): FoodCategory {
	return xlsToFoodCategoryMap[foodGroup] || "Other";
}

function mapRowToNutritions(row: any): Nutrition[] {
	const nutritions: Nutrition[] = [];

	for (const [key, value] of Object.entries(row)) {
		if (!xlsToNutritionMap[key] || value === null || value === undefined || value === "" || value === "N") {
			continue;
		}

		// Parse the nutrition value
		let amount: number;
		if (typeof value === "number") {
			amount = value;
		} else if (typeof value === "string") {
			if (value.toLowerCase() === "tr" || value.toLowerCase() === "trace") {
				amount = 0.01; // Set trace amounts to a small value
			} else if (value.includes("-")) {
				const [min, max] = value.split("-").map((v) => parseFloat(v.trim()));
				amount = (min + max) / 2;
			} else {
				amount = parseFloat(value.replace(/[^0-9.]/g, ""));
			}
		} else {
			continue;
		}

		if (isNaN(amount)) {
			continue;
		}

		if (amount <= 0) {
			continue;
		}

		nutritions.push({
			type: xlsToNutritionMap[key].type,
			unit: xlsToNutritionMap[key].unit,
			amount: amount
		});
	}

	return nutritions;
}

(async () => main())();
