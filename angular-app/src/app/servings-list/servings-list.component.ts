import { Serving, ServingCategory } from "@aicoach/shared";
import { CommonModule, DatePipe } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, map, switchMap, tap } from "rxjs";
import { ServingsService } from "../services/servings.service";
import { ServingDetailsComponent } from "./serving-details/serving-details.component";
import { ServingItemComponent } from "./serving-item/serving-item.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
	selector: "app-servings-list",
	standalone: true,
	imports: [
		CommonModule,
		DatePipe,
		MatExpansionModule,
		MatIconModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatDividerModule,
		MatDialogModule,
		ServingItemComponent
	],
	templateUrl: "./servings-list.component.html",
	styleUrl: "./servings-list.component.scss"
})
export class ServingsListComponent implements OnInit {
	servings$: Observable<Serving[]> | undefined;
	isLoading = signal<boolean>(true);
	isResultEmpty = signal<boolean>(true);

	categorizedServings = new Map<ServingCategory, Serving[]>();
	servingCategories: ServingCategory[] = ["Uncategorized", "Breakfast", "Lunch", "Dinner", "Snacks"];
	selectedDate = new BehaviorSubject<Date>(new Date());

	private destroyRef = inject(DestroyRef);
	private servingsService = inject(ServingsService);
	private dialog = inject(MatDialog);

	ngOnInit(): void {
		this.selectedDate
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				distinctUntilChanged((prev, curr) => prev.getDate() === curr.getDate()),
				tap(() => this.isLoading.set(true)),
				switchMap((date) => this.servingsService.getServingsByDate(date)),
				map((servings) => {
					this.categorizedServings.clear();
					this.servingCategories.forEach((category) => {
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

					return servings;
				}),
				catchError((error) => {
					console.error("Error fetching servings", error);
					this.isLoading.set(false);
					return [];
				})
			)
			.subscribe();
	}

	getServingsByCategory(category: ServingCategory): Serving[] {
		return this.categorizedServings.get(category) || [];
	}

	openServingDetails(serving: Serving): void {
		this.dialog.open(ServingDetailsComponent, {
			width: "600px",
			data: serving
		});
	}

	previousDay(): void {
		const currentDate = this.selectedDate.value;
		const previousDate = new Date(currentDate);
		previousDate.setDate(previousDate.getDate() - 1);
		this.selectedDate.next(previousDate);
	}

	nextDay(): void {
		const currentDate = this.selectedDate.value;
		const nextDate = new Date(currentDate);
		nextDate.setDate(nextDate.getDate() + 1);
		this.selectedDate.next(nextDate);
	}

	today(): void {
		this.selectedDate.next(new Date());
	}
}
