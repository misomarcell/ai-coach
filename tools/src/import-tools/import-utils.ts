import { DietaryFlag, FoodCategory } from "@aicoach/shared";

export function getAssumedFlags(category: FoodCategory): DietaryFlag[] {
	const assumedTags: DietaryFlag[] = [];
	const vegetarianCategories = new Set<FoodCategory>([
		"Fruits",
		"Vegetables",
		"Grains & Cereals",
		"Baked Products",
		"Legumes & Pulses",
		"Nuts & Seeds",
		"Spices and Herbs",
		"Eggs",
		"Dairy & Alternatives"
	]);
	const veganCategories = new Set<FoodCategory>([
		"Fruits",
		"Vegetables",
		"Grains & Cereals",
		"Legumes & Pulses",
		"Nuts & Seeds",
		"Spices and Herbs"
	]);

	if (vegetarianCategories.has(category)) {
		assumedTags.push("vegetarian");
	}

	if (veganCategories.has(category)) {
		assumedTags.push("vegan");
	}

	return assumedTags;
}
