import {
	FoodCategory,
	Nutrition,
	NutritionType,
	NutritionUnit,
	parseCSVLine,
	Serving,
	ServingCategory,
	ServingFood,
	ServingSize
} from "@aicoach/shared";

const foodCategoryMap: Record<string, FoodCategory> = {
	"Baby Foods": "Baby Foods",
	"Baked Products": "Baked Products",
	"Beef Products": "Proteins",
	"Beverages": "Beverages",
	"Breakfast Cereals": "Grains & Cereals",
	"Cereal Grains and Pasta": "Grains & Cereals",
	"Dairy and Egg Products": "Dairy & Alternatives",
	"Ethnic Foods": "Mixed Dishes",
	"Fast Foods": "Snacks & Processed Foods",
	"Fats and Oils": "Fats & Oils",
	"Finfish and Shellfish Products": "Fish",
	"Fruits and Fruit Juices": "Fruits",
	"Lamb, Veal, and Game Products": "Proteins",
	"Legumes and Legume Products": "Legumes & Pulses",
	"Meals, Entrees, and Sidedishes": "Mixed Dishes",
	"Nut and Seed Products": "Nuts & Seeds",
	"Pork Products": "Proteins",
	"Poultry Products": "Proteins",
	"Restaurant Foods": "Restaurant Foods",
	"Sausages and Luncheon Meats": "Proteins",
	"Snacks": "Snacks & Processed Foods",
	"Soups, Sauces, and Gravies": "Soups and Sauces",
	"Spices and Herbs": "Spices and Herbs",
	"Supplements": "Supplements",
	"Sweets": "Sweets & Desserts",
	"Vegetables and Vegetable Products": "Vegetables"
};

const servingCategory: Record<string, ServingCategory> = {
	Breakfast: "Breakfast",
	Snacks: "Snacks",
	Lunch: "Lunch",
	Dinner: "Dinner",
	Uncategorized: "Uncategorized"
};

const nutritionMap: Record<string, { type: NutritionType; unit: NutritionUnit }> = {
	"Energy (kcal)": { type: "Calories", unit: "kcal" },
	"Alcohol (g)": { type: "Alcohol", unit: "g" },
	"Caffeine (mg)": { type: "Caffeine", unit: "mg" },
	"Water (g)": { type: "Water", unit: "g" },
	"B1 (Thiamine) (mg)": { type: "Thiamin", unit: "mg" },
	"B2 (Riboflavin) (mg)": { type: "Riboflavin", unit: "mg" },
	"B3 (Niacin) (mg)": { type: "Niacin", unit: "mg" },
	"B5 (Pantothenic Acid) (mg)": { type: "Pantothenic Acid", unit: "mg" },
	"B6 (Pyridoxine) (mg)": { type: "Vitamin B-6", unit: "mg" },
	"B12 (Cobalamin) (µg)": { type: "Vitamin B-12", unit: "µg" },
	"Folate (µg)": { type: "Folate", unit: "µg" },
	"Vitamin A (µg)": { type: "Vitamin A Total", unit: "µg" },
	"Vitamin C (mg)": { type: "Vitamin C", unit: "mg" },
	"Vitamin D (IU)": { type: "Vitamin D", unit: "IU" },
	"Vitamin E (mg)": { type: "Vitamin E", unit: "mg" },
	"Vitamin K (µg)": { type: "Vitamin K", unit: "µg" },
	"Calcium (mg)": { type: "Calcium", unit: "mg" },
	"Copper (mg)": { type: "Copper", unit: "mg" },
	"Iron (mg)": { type: "Iron", unit: "mg" },
	"Magnesium (mg)": { type: "Magnesium", unit: "mg" },
	"Manganese (mg)": { type: "Manganese", unit: "mg" },
	"Phosphorus (mg)": { type: "Phosphorus", unit: "mg" },
	"Potassium (mg)": { type: "Potassium", unit: "mg" },
	"Selenium (µg)": { type: "Selenium", unit: "µg" },
	"Sodium (mg)": { type: "Sodium", unit: "mg" },
	"Zinc (mg)": { type: "Zinc", unit: "mg" },
	"Carbs (g)": { type: "Carbohydrates", unit: "g" },
	"Fiber (g)": { type: "Fiber", unit: "g" },
	"Starch (g)": { type: "Starch", unit: "g" },
	"Sugars (g)": { type: "Sugar", unit: "g" },
	"Added Sugars (g)": { type: "Sugar", unit: "g" },
	"Net Carbs (g)": { type: "Carbohydrates", unit: "g" },
	"Fat (g)": { type: "Total Fat", unit: "g" },
	"Cholesterol (mg)": { type: "Cholesterol", unit: "mg" },
	"Monounsaturated (g)": { type: "Monounsaturated Fat", unit: "g" },
	"Polyunsaturated (g)": { type: "Polyunsaturated Fat", unit: "g" },
	"Saturated (g)": { type: "Saturated Fat", unit: "g" },
	"Trans-Fats (g)": { type: "Trans Fat", unit: "g" },
	"Omega-3 (g)": { type: "Omega-3 Total", unit: "g" },
	"Omega-6 (g)": { type: "Omega-6 Total", unit: "g" },
	"Cystine (g)": { type: "Cystine", unit: "g" },
	"Histidine (g)": { type: "Histidine", unit: "g" },
	"Isoleucine (g)": { type: "Isoleucine", unit: "g" },
	"Leucine (g)": { type: "Leucine", unit: "g" },
	"Lysine (g)": { type: "Lysine", unit: "g" },
	"Methionine (g)": { type: "Methionine", unit: "g" },
	"Phenylalanine (g)": { type: "Phenylalanine", unit: "g" },
	"Protein (g)": { type: "Protein", unit: "g" },
	"Threonine (g)": { type: "Threonine", unit: "g" },
	"Tryptophan (g)": { type: "Tryptophan", unit: "g" },
	"Tyrosine (g)": { type: "Tyrosine", unit: "g" },
	"Valine (g)": { type: "Valine", unit: "g" }
};

export class CronometerService {
	async convertExportToServings(servingsContent: string): Promise<Serving[]> {
		const headers = this.getCSVHeaders(servingsContent);
		const rows = this.getCSVRows(servingsContent);
		const result: Serving[] = rows
			.map((row) => {
				const rowMap = new Map<string, string>();
				headers.forEach((header, index) => {
					rowMap.set(header, row[index] || "");
				});

				const amountColumn = rowMap.get("Amount") || "0";
				const [amountValue, amountName] = amountColumn.split(" ");

				const amount = parseFloat(amountValue) || 1;
				const servingSize: ServingSize = amountName.endsWith("g")
					? { name: "grams", gramWeight: 1 }
					: { name: amountName, gramWeight: 0 };

				const dayStr = rowMap.get("Day") || "";
				const createdDate = new Date(dayStr);
				const created = isNaN(createdDate.getTime()) ? new Date() : createdDate;
				const nutritionsMap = new Map<NutritionType, Nutrition>();
				for (const header of headers) {
					if (!["Day", "Group", "Food Name", "Amount", "Category"].includes(header)) {
						const value = rowMap.get(header) || "0";
						const nutrition = this.mapNutrition(header, value);

						if (nutrition) {
							const existing = nutritionsMap.get(nutrition.type);
							if (existing) {
								existing.amount += nutrition.amount;
							} else {
								nutritionsMap.set(nutrition.type, nutrition);
							}
						}
					}
				}

				const nutritions: Nutrition[] = Array.from(nutritionsMap.values());

				const food: ServingFood = {
					name: rowMap.get("Food Name") || "",
					brand: undefined,
					category: this.mapfoodCategory(rowMap.get("Category")),
					nutritions,
					isApproved: false,
					dietaryFlags: [],
					tags: ["cronometer-exported"]
				};

				return {
					id: "",
					created,
					servingAmount: amount,
					category: this.mapServingCategory(rowMap.get("Group")),
					food,
					servingSize,
					isCustomized: false,
					comment: "Exported from Cronometer"
				};
			})
			.filter((row) => row.food.name && row.food.nutritions.length > 0);

		return result;
	}

	private getCSVHeaders(content: string): string[] {
		const lines = content.split("\n");

		return parseCSVLine(lines[0]);
	}

	private getCSVRows(content: string): string[][] {
		const lines = content.split("\n");

		return lines.slice(1).map((line) => parseCSVLine(line));
	}

	private mapfoodCategory(value?: string): FoodCategory {
		return foodCategoryMap[value || ""] || "Other";
	}

	private mapServingCategory(value?: string): ServingCategory {
		return servingCategory[value || ""] || "Uncategorized";
	}

	private mapNutrition(name: string, value: string): Nutrition | undefined {
		const mapping = nutritionMap[name];
		if (!mapping) {
			return;
		}

		return {
			type: mapping.type,
			unit: mapping.unit,
			amount: parseFloat(value) || 0
		};
	}
}

export default new CronometerService();
