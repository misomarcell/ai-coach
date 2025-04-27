import { CalorieVision } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { CalorieVisionService } from "../calorie-vision/calorie-vision.service";

export const visionHistoryResolver: ResolveFn<CalorieVision[] | undefined> = () => {
	const calorieVisionService = inject(CalorieVisionService);

	return calorieVisionService.getHistory();
};
