import { foodCategories, nutritionUnits, nutritionTypes, dietaryFlags } from "@aicoach/shared";
import { z } from "zod";

export const SYSTEM_DIET_ANALYSIS_PROMPT = `You are an expert dietitian with advanced knowledge in nutrition and data analysis.
The attached stringified JSON contains my dietary data exported from Cronometer, covering the past 7 days. Please analyze it and provide constructive feedback and practical, actionable suggestions with examples to improve my diet and achieve my goals. I'd like a report of how my overall intake comapres to the ideal diat neede to achieve my goals, highlights of the best and worst performing foods (about 5 each) or nutrients, and a diet quality score between 0-100, with a brief explanation of how you calculated it. Assume the food names in the data may be imprecise or generic due to Cronometer's logging system, and adjust your analysis accordingly. If relevant, search the web or nutritional databases for additional context on unclear items. Provide your response in clear, plain text without any formatting, tables, or markdown, feel free to use emoticons.`;

export const SYSTEM_CALORIE_VISION_PROMPT = `You are a nutrition expert analyzing food images.
	Identify the food visible on the attached image and provide a detailed nutritional analysis of it's contents.
	Include the food's name (you can prefix it with an emoji), estimated weight (in grams), main ingredients, macronutrient breakdown and calorie estimate.`;

export const SYSTEM_PRODUCT_IMAGE_PROMPT =
	"Analyze the two uploaded images—one of a product packaging and one of a nutrition label—and extract information from them.If any information is missing or unclear from the images, indicate it as null or an empty value. Use the product packaging image to determine brand name, product name, product variation, dietary flags, and category where possible, and use the nutrition label image for nutritional data. Cross-reference both images if needed for accuracy.";

export const SYSTEM_DAILY_INTAKE_PROMPT = `You are a nutrition assistant. Based on the provided user health profile and a list of nutrients, estimate the most accurate possible daily recommended intake (DRI) values for each nutrient in the list.
Use established nutritional guidelines (e.g., EFSA, USDA, WHO) and tailor the recommendations to the user's age, sex, weight, height, activity level, health goals, medical conditions and diet type.
If a specific nutrient has no official recommendation or highly varies, give a best-practice estimate and explain in the notes. Please also include a short explanation of the main factors influencing the recommendations.`;

export const DietaryAnalysis = z.object({
	summary: z.string(),
	suggestions: z.array(z.string()),
	positives: z.array(z.object({ foodName: z.string(), comment: z.string() })),
	negatives: z.array(z.object({ foodName: z.string(), comment: z.string() })),
	score: z.number()
});

export const FoodPictureAnalysis = z.object({
	foodName: z.string(),
	foodWeight: z.number(),
	nutitionalInfo: z.object({
		totalCalories: z.number(),
		totalFat: z.number(),
		totalSaturatedFat: z.number(),
		totalCarbs: z.number(),
		totalSugars: z.number(),
		totalFiber: z.number(),
		totalProtein: z.number(),
		totalSalt: z.number(),
		mainIngredients: z.array(
			z.object({
				name: z.string(),
				calories: z.number(),
				weight: z.number()
			})
		)
	})
});

export const ProductImageAnalysis = z.object({
	name: z.string().describe("Product name, preferably in english e.g. Corn Flakes, Chocolate"),
	brand: z.string().optional().describe("e.g., Kellogg's, Nestlé"),
	category: z.enum(foodCategories),
	dietaryFlags: z.array(z.enum(dietaryFlags)),
	variation: z.string().optional().describe("Product variation, e.g. 'apple flavor'"),
	isValidProductImage: z.boolean(),
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
