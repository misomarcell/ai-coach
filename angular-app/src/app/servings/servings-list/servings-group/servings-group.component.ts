import { OverlayService } from "@aicoach/overlay";
import { Serving } from "@aicoach/shared";
import { DecimalPipe } from "@angular/common";
import { Component, effect, inject, input, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { RouterModule } from "@angular/router";
import { EditServingFormComponent } from "../../edit-serving-form/edit-serving-form.component";
import { ServingsService } from "../../servings.service";

@Component({
	selector: "app-servings-group",
	imports: [DecimalPipe, RouterModule, MatButtonModule, MatMenuModule, MatIconModule, MatExpansionModule],
	templateUrl: "./servings-group.component.html",
	styleUrl: "./servings-group.component.scss"
})
export class ServingsGroupComponent {
	groupName = input.required<string>();
	servings = input.required<Serving[]>();
	date = input.required<Date>();
	caloriesTotal = signal<number>(0);

	private overlayService = inject(OverlayService);
	private servingsService = inject(ServingsService);

	constructor() {
		effect(() => {
			this.caloriesTotal.set(this.getTotalCalories());
		});
	}

	getCaloriesFor(serving: Serving): number | undefined {
		return this.servingsService.getServingNutritions(serving).find((n) => n.type === "Calories")?.amount;
	}

	onAddClick(event: Event) {
		event.stopPropagation();
	}

	async onServingClick(serving: Serving): Promise<void> {
		await this.overlayService.open(EditServingFormComponent, {
			data: {
				serving
			}
		});
	}

	getFormattedDate(): string {
		const year = this.date().getFullYear();
		const month = String(this.date().getMonth() + 1).padStart(2, "0");
		const day = String(this.date().getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	}

	private getTotalCalories(): number {
		return this.servings().reduce((total, serving) => total + (this.getCaloriesFor(serving) || 0), 0);
	}
}
