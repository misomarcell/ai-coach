import { Serving, ServingCategory, servingCategories } from "@aicoach/shared";
import { ChangeDetectorRef, Component, effect, inject, input, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterModule } from "@angular/router";
import { ServingsGroupComponent } from "./servings-group/servings-group.component";

@Component({
	selector: "app-servings-list",
	standalone: true,
	imports: [
		ServingsGroupComponent,
		RouterModule,
		MatCardModule,
		MatIconModule,
		MatDialogModule,
		MatButtonModule,
		MatDividerModule,
		MatExpansionModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./servings-list.component.html",
	styleUrl: "./servings-list.component.scss"
})
export class ServingsListComponent {
	isLoading = signal<boolean>(false);
	isResultEmpty = signal<boolean>(true);

	date = input.required<Date>();
	servings = input.required<Serving[]>();
	servingCategories: ServingCategory[] = ["Uncategorized", "Breakfast", "Lunch", "Dinner", "Snacks"];
	categorizedServings = new Map<ServingCategory, Serving[]>();

	private changeDetector = inject(ChangeDetectorRef);

	constructor() {
		effect(() => {
			this.processServings(this.servings());
		});
	}

	private processServings(servings: Serving[]): void {
		this.categorizedServings.clear();
		servingCategories.forEach((category) => {
			this.categorizedServings.set(category, []);
		});

		for (const serving of servings) {
			if (!serving.food) continue;

			if (this.categorizedServings.has(serving.category)) {
				this.categorizedServings.get(serving.category)!.push(serving);
			} else {
				this.categorizedServings.get("Uncategorized")?.push(serving);
			}
		}

		this.categorizedServings.forEach((servingsInCategory) => {
			servingsInCategory.sort((a, b) => a.created.getTime() - b.created.getTime());
		});

		this.isResultEmpty.set(servings.length === 0);
		this.isLoading.set(false);

		this.changeDetector.markForCheck();
	}
}
