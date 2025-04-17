import { Nutrition } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";

@Component({
	selector: "app-nutrition-label",
	imports: [DecimalPipe],
	templateUrl: "./nutrition-label.component.html",
	styleUrl: "./nutrition-label.component.scss"
})
export class NutritionLabelComponent {
	nutritions = input.required<Nutrition[]>();
	calculated = signal<Record<string, number>>({});

	constructor() {
		effect(() => {
			const nutritions = this.nutritions();
			const nutritionRecord = nutritions.reduce<Record<string, number>>((acc, nutrition) => {
				acc[nutrition.type] = nutrition.amount;
				return acc;
			}, {});

			this.calculated.set(nutritionRecord);
		});
	}
}
