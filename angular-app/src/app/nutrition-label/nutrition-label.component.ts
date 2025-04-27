import { Nutrition, NutritionType, NutritionUnit, toSmallestWholeUnit } from "@aicoach/shared";
import { DecimalPipe, NgClass, TitleCasePipe } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";

const DISPLAYED_NUTRITIONS: CalculatedNutrition[] = [
	{
		nutrition: { type: "Calories" },
		label: "Calories"
	},
	{
		nutrition: { type: "Total Fat" },
		label: "Total Fat"
	},
	{
		nutrition: { type: "Saturated Fat" },
		label: "Saturated Fat",
		indented: true
	},
	{
		nutrition: { type: "Carbohydrates" },
		label: "Carbohydrates"
	},
	{
		nutrition: { type: "Sugar" },
		label: "Sugar",
		indented: true
	},
	{
		nutrition: { type: "Fiber" },
		label: "Fiber",
		indented: true
	},
	{
		nutrition: { type: "Protein" },
		label: "Protein"
	},
	{
		nutrition: { type: "Salt" },
		label: "Salt"
	},
	{
		nutrition: { type: "Sodium" },
		label: "Sodium",
		indented: true
	}
];
interface CalculatedNutrition {
	nutrition: { type: NutritionType; unit?: NutritionUnit; amount?: number };
	label: string;
	indented?: boolean;
}

@Component({
	selector: "app-nutrition-label",
	imports: [NgClass, TitleCasePipe, DecimalPipe],
	templateUrl: "./nutrition-label.component.html",
	styleUrl: "./nutrition-label.component.scss"
})
export class NutritionLabelComponent {
	nutritions = input.required<Nutrition[]>();
	per = input<string | undefined>("100g");
	calculated = signal<CalculatedNutrition[]>([]);

	constructor() {
		effect(() => {
			const nutritions = this.nutritions().map((n) => toSmallestWholeUnit(n));
			const updated: CalculatedNutrition[] = [];
			for (const displayed of DISPLAYED_NUTRITIONS) {
				const nutrition = nutritions.find((n) => n.type === displayed.nutrition.type);
				if (nutrition) {
					displayed.nutrition.amount = nutrition.amount;
					displayed.nutrition.unit = nutrition.unit;
				}

				updated.push(displayed);
			}

			this.calculated.set(updated);
		});
	}
}
