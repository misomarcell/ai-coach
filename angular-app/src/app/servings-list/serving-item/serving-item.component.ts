import { Serving, ServingFood } from "@aicoach/shared";
import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

@Component({
	selector: "app-serving-item",
	standalone: true,
	imports: [CommonModule, MatIconModule],
	templateUrl: "./serving-item.component.html",
	styleUrl: "./serving-item.component.scss"
})
export class ServingItemComponent {
	serving = input.required<Serving>();

	getCaloriesFor(food: ServingFood): number {
		return food.nutritions.find((nutrition) => nutrition.type === "Calories")?.amount ?? 0;
	}
}
