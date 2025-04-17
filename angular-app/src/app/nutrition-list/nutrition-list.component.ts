import { Nutrition, NutritionUnit, toSmallestWholeUnit } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";

const UNIT_PRIORITY: Record<NutritionUnit, number> = {
	"kcal": 6,
	"%": 5,
	"g": 4,
	"mg": 3,
	"ml": 2,
	"IU": 1,
	"µg": 0
};

@Component({
	selector: "app-nutrition-list",
	imports: [DecimalPipe, MatExpansionModule],
	templateUrl: "./nutrition-list.component.html",
	styleUrl: "./nutrition-list.component.scss"
})
export class NutritionListComponent {
	nutritions = input.required<Nutrition[]>();
	sortedNutritions = signal<Nutrition[]>([]);

	constructor() {
		effect(() => {
			const nutritions = this.nutritions();
			this.sortedNutritions.set(this.getSortedNutritionList(nutritions).map((n) => toSmallestWholeUnit(n)));
		});
	}

	private getSortedNutritionList(nutritions: Nutrition[]): Nutrition[] {
		const sorted = [...nutritions].sort((a, b) => {
			const priorityA = UNIT_PRIORITY[a.unit] ?? 0;
			const priorityB = UNIT_PRIORITY[b.unit] ?? 0;
			if (priorityA !== priorityB) {
				return priorityB - priorityA;
			}
			return b.amount - a.amount;
		});

		return sorted.filter((n) => n.amount > 0);
	}
}
