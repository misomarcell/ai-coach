import { Food, ServingFood } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, input } from "@angular/core";

@Component({
	selector: "app-nutrition-label",
	imports: [DecimalPipe],
	templateUrl: "./nutrition-label.component.html",
	styleUrl: "./nutrition-label.component.scss"
})
export class NutritionLabelComponent {
	food = input<Food | ServingFood | undefined>(undefined);
	grams = input<number>(100);
	calculated: Record<string, number> = {};

	constructor() {
		effect(() => this.calculateNutritionAmounts());
	}

	private calculateNutritionAmounts(): void {
		this.food()?.nutritions.forEach((nutrition) => {
			this.calculated[nutrition.type] = (nutrition.amount * (this.grams() || 100)) / 100;
		});
	}
}
