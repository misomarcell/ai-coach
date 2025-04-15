import { Serving } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, inject, input, signal } from "@angular/core";
import { ServingsService } from "../servings/servings.service";

@Component({
	selector: "app-nutrition-label",
	imports: [DecimalPipe],
	templateUrl: "./nutrition-label.component.html",
	styleUrl: "./nutrition-label.component.scss"
})
export class NutritionLabelComponent {
	serving = input<Serving | undefined>(undefined);
	calculated = signal<Record<string, number>>({});

	private servingsService = inject(ServingsService);

	constructor() {
		effect(() => {
			const serving = this.serving();
			if (!serving) {
				return;
			}

			const nutritionsArray = this.servingsService.getNutritionAmounts(serving);
			const nutritionRecord = nutritionsArray.reduce<Record<string, number>>((acc, nutrition) => {
				acc[nutrition.type] = nutrition.amount;
				return acc;
			}, {});

			this.calculated.set(nutritionRecord);
		});
	}
}
