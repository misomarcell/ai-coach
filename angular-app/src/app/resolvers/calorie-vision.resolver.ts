import { CalorieVision } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn, Router } from "@angular/router";
import { CalorieVisionService } from "../calorie-vision/calorie-vision.service";

export const calorieVisionResolver: ResolveFn<CalorieVision | undefined> = (route, _state) => {
	const router = inject(Router);
	const calorieVisionService = inject(CalorieVisionService);
	const documentId = route.paramMap.get("visionId");
	if (!documentId) {
		router.navigate(["/not-found"]);

		return;
	}

	return calorieVisionService.getCalorieVision(documentId);
};
