import { foodCategories, nutritionUnits, nutritionTypes, dietaryFlags } from "@aicoach/shared";
import { NEVER, z } from "zod";

export const SYSTEM_DIET_ANALYSIS_PROMPT = `You are an expert dietitian with advanced knowledge in nutrition and data analysis.
The attached stringified JSON contains my dietary data from the past 7 days. Please analyze it and provide constructive feedback and practical, actionable suggestions with examples to improve my diet and achieve my goals. I'd like a report of how my overall intake comapres to the ideal diet neede to achieve my goals, highlights of the best and worst performing foods or nutrients (about 5 each), and a diet quality score between 0-100, with a brief explanation of how you calculated it. Assume the food names in the data may be imprecise or generic, and adjust your analysis accordingly. If relevant, search the web or nutritional databases for additional context on unclear items. Provide your response in clear, plain text without any formatting, tables, or markdown, feel free to use emoticons.`;

export const SYSTEM_CALORIE_VISION_PROMPT =
	"You are a nutrition expert analyzing food images. Identify the food visible on the attached image and provide a detailed nutritional analysis of it's ingredients and nutritional contents. In case user data was also provided, consider them when scoring the nutritional value of the food.";

export const SYSTEM_PRODUCT_IMAGE_PROMPT =
	"You are given two images of a single food product: one showing the front of the product packaging, the other its nutrition facts label. Provide details about the product and it's nutrition facts based on it's packaging.";

export const SYSTEM_DAILY_INTAKE_PROMPT = `You are a nutrition assistant. Based on the provided user health profile and a list of nutrients, estimate the most accurate possible daily recommended intake (DRI) values for each nutrient in the attached list (Calories, Net Carbs, Fiber, etc.).
Use established nutritional guidelines (e.g., EFSA, USDA, WHO) and tailor the recommendations to the user's age, sex, weight, height, activity level, health goals, medical conditions and diet type.
If a specific nutrient has no official recommendation or highly varies, give a best-practice estimate and explain in the notes. Please also include a short explanation of the main factors influencing the recommendations.`;

export const DietaryAnalysis = z.object({
	summary: z.string(),
	suggestions: z.array(z.string()),
	positives: z.array(z.object({ foodName: z.string(), comment: z.string() })),
	negatives: z.array(z.object({ foodName: z.string(), comment: z.string() })),
	score: z.number()
});

export const requiredNutritionTypes = [
	"Calories",
	"Total Fat",
	"Saturated Fat",
	"Carbohydrates",
	"Sugar",
	"Fiber",
	"Protein",
	"Salt",
	"Sodium"
] as const;
export type RequiredNutritionType = (typeof requiredNutritionTypes)[number];
const RequiredNutritionTypeEnum = z.enum(requiredNutritionTypes).describe("Must be one of the 9 required nutrition types");

export const FoodPictureAnalysis = z
	.object({
		foodName: z.string(),
		foodWeight: z.number(),
		foodCalories: z.number().describe("Total calories in the entire food on the picture."),
		isValidFoodImage: z.boolean().describe("True only if the attached image shows a food or dish"),
		foodCategory: z.enum(foodCategories).describe("Select the most appropriate category from the list"),
		evaluation: z.object({
			score: z.number().describe("Score the food on a scale from 0 to 100 based on it's nutritional value."),
			description: z.string().describe("A short description of the food's nutritional value.")
		}),
		nutritions: z.array(
			z
				.object({
					type: RequiredNutritionTypeEnum,
					unit: z.enum(nutritionUnits).describe("Unit for the nutrition amount (e.g. kcal, g, mg)"),
					amount: z.number().describe("Amount of this nutrient per 100 g of the dish")
				})
				.describe("One nutrition entry: type + unit + amount")
		),

		mainIngredients: z.array(
			z.object({
				name: z.string().describe("Name of the ingredient"),
				calories: z.number().describe("Total calories in the ingredient"),
				gramWeight: z.number().describe("Total weight of the ingredient in grams")
			})
		)
	})
	.superRefine((data, ctx) => {
		if (!data.isValidFoodImage) {
			return NEVER;
		}

		const seen = new Set(data.nutritions.map((n) => n.type));
		for (const type of requiredNutritionTypes) {
			if (!seen.has(type)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["nutritions"],
					message: `Missing nutrition entry for “${type}”.`
				});
			}
		}

		if (seen.size !== data.nutritions.length) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["nutritions"],
				message: "Duplicate nutrition types are not allowed."
			});
		}

		return true;
	});

export const ProductImageAnalysis = z.object({
	name: z.string().describe("Product name, preferably in english e.g. Corn Flakes, Chocolate"),
	brand: z.string().optional().describe("e.g., Kellogg's, Nestlé"),
	category: z.enum(foodCategories).describe("Select the msot appropriate category from the list"),
	dietaryFlags: z.array(z.enum(dietaryFlags)).describe("e.g., vegan, vegetarian, gluten-free, empty array if none"),
	variation: z.string().optional().describe("Product variation, e.g. 'apple flavor'"),
	isValidProductImage: z.boolean().describe("True if the attached are valid product images"),
	servingSizes: z
		.array(
			z.object({
				name: z.string(),
				gramWeight: z.number()
			})
		)
		.optional()
		.describe("List of estimated serving sizes, without amount, (e.g. 'cup', 'slice', 'whole box') and their weight in grams"),
	nutritions: z.array(
		z
			.object({
				type: z.enum(nutritionTypes),
				unit: z.enum(nutritionUnits),
				amount: z.number()
			})
			.describe("Nutrition per 100g")
	)
});

export const DailyIntakeRecommendation = z.object({
	explanation: z.string().describe("Explanation of main factors influencing the recommendations"),
	nutritions: z.array(
		z.object({
			type: z.enum(nutritionTypes),
			unit: z.enum(nutritionUnits),
			amount: z.number()
		})
	)
});
