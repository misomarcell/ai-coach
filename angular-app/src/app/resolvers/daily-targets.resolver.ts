import { DailyTargets } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { DailyTargetsService } from "../services/daily-targets.service";

export const dailyTargetsResolver: ResolveFn<DailyTargets | undefined> = () => {
	const dailyTargetsService = inject(DailyTargetsService);

	return dailyTargetsService.getDailyTargets();
};
