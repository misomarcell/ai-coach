import { Food, NutritionType, Serving } from "@aicoach/shared";
import { DatePipe, DecimalPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute } from "@angular/router";
import { FoodService } from "../../services/food.service";

@Component({
	standalone: true,
	imports: [DecimalPipe, DatePipe, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
	templateUrl: "./serving-details-page.component.html",
	styleUrl: "./serving-details-page.component.scss"
})
export class ServingDetailsComponent {
	serving = signal<Serving | undefined>(undefined);
	food = signal<Food | undefined>(undefined);
	mainNutritionTypes: NutritionType[] = [
		"Calories",
		"Total Fat",
		"Saturated Fat",
		"Carbohydrates",
		"Sugar",
		"Fiber",
		"Protein",
		"Sodium",
		"Alcohol"
	];

	private foodService = inject(FoodService);
	private activatedRoute = inject(ActivatedRoute);

	constructor() {
		const servingData = this.activatedRoute.snapshot.data["serving"];

		this.serving.set(servingData);
		this.foodService.getFood(servingData.food?.foodId).subscribe((food) => this.food.set(food));
	}

	hasDietaryFlags(): boolean {
		const food = this.serving()?.food;
		if (!food) {
			return false;
		}

		return !!food.dietaryFlags && food.dietaryFlags.length > 0;
	}

	getServingSizeText(): string {
		const serving = this.serving();
		if (!serving) {
			return "N/A";
		}

		const name = serving.servingSize.name;
		const amount = serving.servingAmount ?? 0;
		const weight = serving.servingSize.gramWeight ?? "g";

		return name === "g" ? `${amount}${name}` : `${amount} ${name} (${weight})`;
	}

	getDietaryFlagsList(): string[] {
		return this.serving()?.food?.dietaryFlags ?? [];
	}
}
