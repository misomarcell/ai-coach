import { calculateAge, calculateMaintenanceCalories, HealthProfileDb } from "@aicoach/shared";
import { Timestamp } from "firebase-admin/firestore";

export function generateHealthProfileSummary(healthProfile: HealthProfileDb): string | undefined {
	if (!healthProfile) {
		return "Error: Health profile data is missing.";
	}

	const { gender, weightKg, heightCm, activityLevel } = healthProfile;
	const dob = (healthProfile.birthDate as Timestamp)?.toDate();
	const age = calculateAge(dob);
	if (!age || isNaN(age)) {
		console.error("Invalid age calculated from birth date.");
		return;
	}

	const bmi = calculateMaintenanceCalories({ age, gender, heightCm, activityLevel, weightKg });
	if (!bmi) {
		console.error("Invalid BMI calculated from health profile data.");
		return;
	}

	const summaryLines: string[] = [
		"User Profile for Nutrition Analysis:",
		`- Gender: ${healthProfile.gender}`,
		`- Age: ${age} years`,
		`- Height: ${healthProfile.heightCm} cm`,
		`- Weight: ${healthProfile.weightKg} kg`,
		`- Calculated BMI: ${bmi > 0 ? bmi : "N/A"}`,
		`- Activity Level: ${healthProfile.activityLevel}`
	];

	if (healthProfile.dietGoals && healthProfile.dietGoals.length > 0) {
		summaryLines.push(`- Primary Diet Goals: ${healthProfile.dietGoals.join(", ")}`);
	} else {
		summaryLines.push("- Primary Diet Goals: Not specified");
	}

	if (healthProfile.dietaryRestrictions && healthProfile.dietaryRestrictions.length > 0) {
		summaryLines.push(`- Dietary Restrictions: ${healthProfile.dietaryRestrictions.join(", ")}`);
	} else {
		summaryLines.push("- Dietary Restrictions: None specified");
	}

	if (healthProfile.healthConditions && healthProfile.healthConditions.length > 0) {
		summaryLines.push(`- Relevant Health Conditions: ${healthProfile.healthConditions.join(", ")}`);
	} else {
		summaryLines.push("- Relevant Health Conditions: None specified");
	}

	return summaryLines.join("\n");
}
