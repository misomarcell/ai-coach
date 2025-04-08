import { NutritionType } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { FoodSearchResult } from "../../services/food-search.service";

@Component({
	selector: "app-food-search-result",
	standalone: true,
	imports: [DecimalPipe, MatCardModule],
	templateUrl: "./food-search-result.component.html",
	styleUrl: "./food-search-result.component.scss"
})
export class FoodSearchResultComponent {
	food = input.required<FoodSearchResult>();
	foodClick = output<FoodSearchResult>();

	getNutritionFor(food: FoodSearchResult, nutriType: NutritionType): number {
		const caloriesNutrition = food.nutritions.find((nutrition) => nutrition.type === nutriType);

		return caloriesNutrition ? caloriesNutrition.amount : 0;
	}

	onFoodClick(): void {
		this.foodClick.emit(this.food());
	}
}
