import { AnalysisPreferences } from "@aicoach/shared";

export function buildPreferences(preferences: AnalysisPreferences): string {
	let preferencesString = `Short description of myself: ${preferences.description}. My are: ${preferences.goals.join(
		", "
	)}. Suggest me changes helping me achieve them.`;

	if (preferences.dietaryRestrictions) {
		preferencesString += ` My dietary restrictions: ${preferences.dietaryRestrictions.join(
			", "
		)}. Please consider them in your evaluation.`;
	}

	if (preferences.healthConditions) {
		preferencesString += ` My health conditions: ${preferences.healthConditions.join(", ")}. Please consider them in your evaluation.`;
	}

	return preferencesString;
}
