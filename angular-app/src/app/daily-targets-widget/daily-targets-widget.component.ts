import { DailyTargets, Nutrition, NutritionType, nutritionTypes } from "@aicoach/shared";
import { DecimalPipe, isPlatformServer } from "@angular/common";
import { Component, computed, effect, inject, input, PLATFORM_ID, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../prompt-dialog/prompt-dialog.component";
import { DailyTargetsService } from "../services/daily-targets.service";

export interface Target {
	nutrition: Nutrition;
	percentage: number;
}

const DEFAULT_NUTRITION_TYPES: NutritionType[] = ["Calories", "Net Carbs", "Total Fat", "Protein"];

@Component({
	selector: "app-daily-targets-widget",
	imports: [DecimalPipe, RouterModule, MatProgressBarModule, MatProgressSpinnerModule, MatCardModule, MatButtonModule, MatIconModule],
	templateUrl: "./daily-targets-widget.component.html",
	styleUrl: "./daily-targets-widget.component.scss"
})
export class DailyTargetsWidgetComponent {
	private dialog = inject(MatDialog);
	private dailyTargetsService = inject(DailyTargetsService);
	private activatedRoute = inject(ActivatedRoute);
	private platformId = inject(PLATFORM_ID);

	private dailyTargets = signal<DailyTargets | undefined>(this.activatedRoute.snapshot.data["dailyTargets"]);
	actualNutritions = input.required<Nutrition[]>();
	explanation = signal<string | undefined>(undefined);

	showAllNutritions = signal(false);
	displayedNutrition = signal<NutritionType[]>(DEFAULT_NUTRITION_TYPES);

	targets = computed(() => {
		const result = this.dailyTargets();
		const displayedNutrition = this.displayedNutrition();
		const nutritions = !result?.nutritons
			? []
			: result.nutritons
					.filter((nutrition) => displayedNutrition.includes(nutrition.type))
					.map((nutrition) => {
						const actualNutrition = this.actualNutritions().find((n) => n.type === nutrition.type);

						return {
							nutrition,
							actualAmount: actualNutrition ? actualNutrition.amount : 0,
							actualUnit: actualNutrition ? actualNutrition.unit : nutrition.unit,
							targetAmount: nutrition.amount,
							targetUnit: nutrition.unit,
							percentage: this.calculateNutritionPercentage(actualNutrition, nutrition) || 0
						};
					});

		return { nutritions, status: result?.status };
	});

	constructor() {
		effect(() => {
			if (isPlatformServer(this.platformId)) {
				return;
			}

			this.displayedNutrition.set(this.showAllNutritions() ? [...nutritionTypes] : DEFAULT_NUTRITION_TYPES);
		});

		this.dailyTargetsService.getDailyTargets().subscribe((result) => {
			this.dailyTargets.set(result);
			this.explanation.set(result?.explanation);
		});
	}

	showExplanation(): void {
		this.dialog.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: {
				title: "Nutrition Targets",
				message: this.explanation() || "No explanation available.",
				buttonLayout: "ok"
			}
		});
	}

	private calculateNutritionPercentage(actualNutrition?: Nutrition, targetNutrition?: Nutrition): number {
		if (!actualNutrition || !targetNutrition || actualNutrition.type !== targetNutrition.type) {
			return 0;
		}

		let actualAmount = actualNutrition.amount;
		const actualUnit = actualNutrition.unit;
		const targetUnit = targetNutrition.unit;

		if (actualUnit !== targetUnit) {
			const conversions: Record<string, number> = {
				"g-mg": 1000, // 1 g = 1000 mg
				"mg-g": 0.001,
				"mg-µg": 1000, // 1 mg = 1000 µg
				"µg-mg": 0.001,
				"g-µg": 1000000, // 1 g = 1000000 µg
				"µg-g": 0.000001,
				"ml-l": 0.001 // 1 ml = 0.001 l (if liters were included, here for completeness)
			};

			const conversionKey = `${actualUnit}-${targetUnit}`;
			const reverseKey = `${targetUnit}-${actualUnit}`;

			let conversionFactor: number | undefined;
			if (conversions[conversionKey]) {
				conversionFactor = conversions[conversionKey];
			} else if (conversions[reverseKey]) {
				conversionFactor = 1 / conversions[reverseKey];
			}

			if (actualNutrition.type === "Water") {
				conversionFactor = 1;
			}

			if (!conversionFactor) {
				console.error(`No conversion factor found for ${actualNutrition.type} to ${targetNutrition.type}`);
				return 0;
			}

			actualAmount *= conversionFactor;
		}

		if (targetNutrition.amount === 0) {
			return 0;
		}

		const percentage = (actualAmount / targetNutrition.amount) * 100;

		return Math.round(percentage);
	}
}
