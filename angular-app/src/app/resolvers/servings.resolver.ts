import { Serving } from "@aicoach/shared";
import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { ServingsService } from "../servings/servings.service";

export const servingsResolver: ResolveFn<Serving[]> = () => {
	const servingsService = inject(ServingsService);
	const currentDate = new Date();

	return servingsService.getServingsByDate(currentDate);
};
