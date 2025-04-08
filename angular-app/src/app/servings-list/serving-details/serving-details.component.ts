import { Component, inject } from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { Nutrition, NutritionType, Serving } from "@aicoach/shared";

@Component({
	selector: "app-serving-details",
	standalone: true,
	imports: [DecimalPipe, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
	templateUrl: "./serving-details.component.html",
	styleUrl: "./serving-details.component.scss"
})
export class ServingDetailsComponent {
	serving = inject<Serving>(MAT_DIALOG_DATA);
	dialogRef = inject(MatDialogRef<ServingDetailsComponent>);
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

	hasDietaryFlags(): boolean {
		return !!this.serving.food?.dietaryFlags && this.serving.food.dietaryFlags.length > 0;
	}

	getDietaryFlagsList(): string[] {
		if (!this.serving.food.dietaryFlags) {
			return [];
		}

		return Array.from(this.serving.food.dietaryFlags);
	}

	close(): void {
		this.dialogRef.close();
	}

	getMainNutrients(): Nutrition[] {
		return this.serving.food.nutritions.filter((n) => this.mainNutritionTypes.includes(n.type));
	}

	getOtherNutrients(): Nutrition[] {
		return this.serving.food.nutritions.filter((n) => !this.mainNutritionTypes.includes(n.type)).filter((n) => n.amount > 0);
	}
}
