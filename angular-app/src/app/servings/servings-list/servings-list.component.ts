import { Serving, ServingCategory, servingCategories } from "@aicoach/shared";
import { ChangeDetectorRef, Component, DestroyRef, inject, input, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterModule } from "@angular/router";
import { catchError, distinctUntilChanged, startWith, switchMap, tap } from "rxjs";
import { DateSelectorComponent } from "../../date-selector/date-selector.component";
import { ServingsService } from "../servings.service";
import { ServingsGroupComponent } from "./servings-group/servings-group.component";

@Component({
	selector: "app-servings-list",
	standalone: true,
	imports: [
		DateSelectorComponent,
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
	initialServings = input<Serving[]>([]);

	isLoading = signal<boolean>(false);
	isResultEmpty = signal<boolean>(true);

	selectedDate = signal<Date>(new Date());
	servingCategories: ServingCategory[] = ["Uncategorized", "Breakfast", "Lunch", "Dinner", "Snacks"];
	categorizedServings = new Map<ServingCategory, Serving[]>();

	private changeDetector = inject(ChangeDetectorRef);
	private destroyRef = inject(DestroyRef);
	private servingsService = inject(ServingsService);

	constructor() {
		toObservable(this.selectedDate)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				distinctUntilChanged((prev, curr) => prev.getDate() === curr.getDate()),
				switchMap((date) => this.servingsService.getServingsByDate(date)),
				startWith(this.initialServings()),
				tap((servings) => this.processServings(servings)),
				catchError((error) => {
					console.error("Error fetching servings", error);
					this.isLoading.set(false);
					return [];
				})
			)
			.subscribe();
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
			servingsInCategory.sort((a, b) => b.created.getTime() - a.created.getTime());
		});

		this.isResultEmpty.set(servings.length === 0);
		this.isLoading.set(false);

		this.changeDetector.markForCheck();
	}
}
