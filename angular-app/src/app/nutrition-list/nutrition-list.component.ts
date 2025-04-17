import { Nutrition, NutritionUnit } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { MatExpansionModule } from "@angular/material/expansion";

const CONVERSION_FACTORS: Record<NutritionUnit, number> = {
	"g": 1_000_000, // 1g = 1,000,000 µg
	"mg": 1_000, // 1mg = 1,000 µg
	"µg": 1, // Base unit for mass
	"kcal": 1, // No conversion (standalone)
	"IU": 1, // No conversion (standalone)
	"ml": 1, // Base unit for volume
	"%": 1 // No conversion (standalone)
};

const CONVERTIBLE_UNITS = {
	mass: ["g", "mg", "µg"] as NutritionUnit[],
	standalone: ["kcal", "IU", "ml", "%"] as NutritionUnit[]
};

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
			this.sortedNutritions.set(this.getSortedNutritionList(nutritions).map((n) => this.toSmallestWholeUnit(n)));
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

	private toSmallestWholeUnit(nutrition: Nutrition): Nutrition {
		const { type, unit, amount } = nutrition;
		if (CONVERTIBLE_UNITS.standalone.includes(unit)) {
			const wholeAmount = Math.round(amount);

			return { type, unit, amount: wholeAmount };
		}

		if (CONVERTIBLE_UNITS.mass.includes(unit)) {
			const amountInMicrograms = amount * CONVERSION_FACTORS[unit];

			for (const targetUnit of CONVERTIBLE_UNITS.mass) {
				const amountInTargetUnit = amountInMicrograms / CONVERSION_FACTORS[targetUnit];
				if (!isNaN(amountInTargetUnit) && amountInTargetUnit > 1) {
					return { type, unit: targetUnit, amount: amountInTargetUnit };
				}
			}

			return { type, unit: "µg", amount: Math.round(amountInMicrograms) };
		}

		return { type, unit, amount: Math.round(amount) };
	}
}
