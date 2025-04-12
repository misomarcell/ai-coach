export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very active";
export interface CalorieInput {
	gender: "male" | "female";
	age: number;
	heightCm: number;
	weightKg: number;
	activityLevel: ActivityLevel;
}

const activityMultipliers: Record<ActivityLevel, number> = {
	"sedentary": 1.2,
	"light": 1.375,
	"moderate": 1.55,
	"active": 1.725,
	"very active": 1.9
};

/**
 * Estimates daily maintenance calories (Total Daily Energy Expenditure - TDEE)
 * needed to maintain current weight, using the Mifflin-St Jeor equation for BMR
 * and standard activity multipliers.
 *
 * @param input - An object containing gender, age (years), height (cm), weight (kg), and activityLevel.
 * @returns The estimated daily maintenance calories (kcal), rounded to the nearest integer. Returns 0 if input is invalid.
 */
export function calculateMaintenanceCalories(input: CalorieInput): number | undefined {
	const { gender, age, heightCm, weightKg, activityLevel } = input;
	if (!gender || (gender !== "male" && gender !== "female")) {
		return undefined;
	}
	if (typeof age !== "number" || age <= 0 || age > 120 || !Number.isInteger(age)) {
		return undefined;
	}
	if (typeof heightCm !== "number" || weightKg <= 0) {
		return undefined;
	}
	if (typeof heightCm !== "number" || weightKg <= 0) {
		return undefined;
	}
	if (!activityLevel || !activityMultipliers[activityLevel]) {
		return undefined;
	}

	// --- 1. Calculate BMR using Mifflin-St Jeor ---
	let bmr: number;

	// Formula requires weight in kg and height in cm.
	if (gender === "male") {
		// BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5
		bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
	} else {
		// gender === 'female'
		// BMR = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161
		bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
	}

	// BMR shouldn't reasonably be negative or zero
	if (bmr <= 0) {
		console.warn("Calculated BMR is non-positive, calculation may be inaccurate.");
		// Decide how to handle - return 0 or maybe a minimum value? Let's return 0 for safety.
		return 0;
	}

	// --- 2. Get Activity Multiplier ---
	const multiplier = activityMultipliers[activityLevel];

	// --- 3. Calculate TDEE (Maintenance Calories) ---
	const tdee = bmr * multiplier;

	// --- 4. Return rounded value ---
	return Math.round(tdee);
}

export function calculateAge(birthDate: Date): number | undefined {
	if (!(birthDate instanceof Date)) {
		return undefined;
	}

	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return age;
}

export function calculateBmi(weightKg: number, heightCm: number): number {
	if (weightKg <= 0 || heightCm <= 0) {
		return 0;
	}

	const heightM = heightCm / 100;
	const bmi = weightKg / (heightM * heightM);
	return parseFloat(bmi.toFixed(2));
}
