import { DailyTargetsResult, Nutrition, NutritionType, nutritionTypes } from "@aicoach/shared";
import { Component, effect, inject, input, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { map, startWith, switchMap, tap } from "rxjs";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../prompt-dialog/prompt-dialog.component";
import { DailyTargetsService } from "../services/daily-targets.service";

export interface Target {
	nutrition: Nutrition;
	percentage: number;
}

@Component({
	selector: "app-daily-targets-widget",
	imports: [RouterModule, MatProgressBarModule, MatCardModule, MatButtonModule, MatIconModule],
	templateUrl: "./daily-targets-widget.component.html",
	styleUrl: "./daily-targets-widget.component.scss"
})
export class DailyTargetsWidgetComponent {
	private dialog = inject(MatDialog);
	private dailyTargetsService = inject(DailyTargetsService);
	private activatedRoute = inject(ActivatedRoute);

	actualNutritions = input.required<Nutrition[]>();
	explanation = signal<string | undefined>(undefined);

	showAllNutritions = signal(false);
	displayedNutrition = signal<NutritionType[]>([]);
	targets = toSignal<Target[] | undefined>(
		toObservable(this.displayedNutrition).pipe(
			switchMap((displayedNutrition) =>
				this.dailyTargetsService.getDailyTargets().pipe(
					startWith(this.activatedRoute.snapshot.data["dailyTargets"] as DailyTargetsResult),
					tap((result) => this.explanation.set(result?.explanation)),
					map((result) =>
						result?.nutritons
							.filter((nutrition) => displayedNutrition.includes(nutrition.type))
							.map((nutrition) => ({
								nutrition,
								percentage:
									this.calculateNutritionPercentage(
										this.actualNutritions().find((n) => n.type === nutrition.type),
										nutrition
									) || 0
							}))
					)
				)
			)
		)
	);

	constructor() {
		effect(() => {
			this.displayedNutrition.set(
				this.showAllNutritions() ? [...nutritionTypes] : ["Calories", "Carbohydrates", "Total Fat", "Protein"]
			);
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

	calculateNutritionPercentage(actualNutrition?: Nutrition, targetNutrition?: Nutrition): number {
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
