import { OverlayService } from "@aicoach/overlay";
import { Serving } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, inject, input, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { Router, RouterModule } from "@angular/router";

@Component({
	selector: "app-servings-group",
	imports: [DecimalPipe, RouterModule, MatButtonModule, MatMenuModule, MatIconModule, MatExpansionModule],
	templateUrl: "./servings-group.component.html",
	styleUrl: "./servings-group.component.scss"
})
export class ServingsGroupComponent {
	groupName = input.required<string>();
	servings = input.required<Serving[]>();
	caloriesTotal = signal<number>(0);

	router = inject(Router);
	overlayService = inject(OverlayService);

	constructor() {
		effect(() => {
			this.caloriesTotal.set(this.getTotalCalories());
		});
	}

	getCaloriesFor(serving: Serving): number {
		const foodCalories = serving.food.nutritions.find((nutrition) => nutrition.type === "Calories")?.amount ?? 0;

		return (foodCalories * (serving.servingAmount ?? 1) * (serving.servingSize.gramWeight ?? 1)) / 100;
	}

	onAddClick(event: Event) {
		event.stopPropagation();
	}

	async onServingClick(serving: Serving): Promise<void> {
		await this.overlayService.open(
			() => import("../../../servings/edit-serving-form/edit-serving-form.component").then((m) => m.EditServingFormComponent),
			{
				data: {
					serving,
					foodId: serving.food.id
				}
			}
		);
	}

	private getTotalCalories(): number {
		return this.servings().reduce((total, serving) => total + this.getCaloriesFor(serving), 0);
	}
}
