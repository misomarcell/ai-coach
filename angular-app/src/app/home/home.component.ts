import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";
import { DailyTargetsWidgetComponent } from "../daily-targets-widget/daily-targets-widget.component";
import { ServingsListComponent } from "../servings/servings-list/servings-list.component";
import { Nutrition, Serving } from "@aicoach/shared";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [ServingsListComponent, DailyTargetsWidgetComponent, MatProgressSpinnerModule, MatCardModule],
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss"
})
export class HomeComponent {
	private route = inject(ActivatedRoute);
	currentServings = toSignal<Serving[]>(this.route.data.pipe(map((data) => data["servings"] ?? [])));

	get actualNutritions() {
		return this.getTotalNutritionAmounts(this.currentServings()!);
	}

	private getTotalNutritionAmounts(servings: Serving[]): Nutrition[] {
		if (!servings) {
			return [];
		}

		const totalNutritionAmounts: Nutrition[] = [];
		for (const serving of servings) {
			for (const nutrition of serving.food.nutritions) {
				const existingNutrition = totalNutritionAmounts.find((n) => n.type === nutrition.type);
				if (existingNutrition) {
					existingNutrition.amount += nutrition.amount * (((serving.servingSize.gramWeight || 1) * serving.servingAmount) / 100);
				} else {
					totalNutritionAmounts.push({
						...nutrition,
						amount: nutrition.amount * (((serving.servingSize.gramWeight || 1) * serving.servingAmount) / 100)
					});
				}
			}
		}

		return totalNutritionAmounts;
	}
}
