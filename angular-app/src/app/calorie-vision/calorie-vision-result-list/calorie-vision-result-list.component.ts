import { CalorieVision, CronometerFood, CronometerFoodRequestStatus } from "@aicoach/shared";
import { AsyncPipe, DatePipe, NgForOf, NgIf } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { Observable, of, switchMap, tap } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { CustomFoodService } from "../../services/custom-food.service";
import { CalorieVisionService } from "../calorie-vision.service";

@Component({
	selector: "app-calorie-vision-result-list",
	imports: [
		NgIf,
		NgForOf,
		PageTitleComponent,
		DatePipe,
		AsyncPipe,
		MatCardModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatIconModule,
		MatSnackBarModule,
		MatExpansionModule,
		MatDividerModule
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./calorie-vision-result-list.component.html",
	styleUrl: "./calorie-vision-result-list.component.scss"
})
export class CalorieVisionResultListComponent {
	isLoading = true;
	isEmpty = false;
	addingStatus = signal<CronometerFoodRequestStatus | undefined>(undefined);
	results$: Observable<CalorieVision[]> | undefined;

	private destroyRef = inject(DestroyRef);
	private changeDetector = inject(ChangeDetectorRef);
	private loadedImages: Record<string, string> = {};

	@Input() currentFileName: string | undefined;
	constructor(
		private calorieVisionService: CalorieVisionService,
		private customFoodService: CustomFoodService,
		private authService: AuthService,
		private snackBar: MatSnackBar
	) {
		this.results$ = this.calorieVisionService.getHistory().pipe(
			tap((results) => {
				this.isLoading = false;
				this.isEmpty = !results || results.length === 0;
				this.changeDetector.detectChanges();
			})
		);
	}

	getImageUrl(fileName: string): Observable<string> {
		return this.loadedImages[fileName]
			? of(this.loadedImages[fileName])
			: this.calorieVisionService.getImageUrlFromFileName(fileName).pipe(tap((imageUrl) => (this.loadedImages[fileName] = imageUrl)));
	}

	copy(value: string | number): void {
		if (!value) return;

		navigator.clipboard.writeText(`${value}`);
		this.snackBar.open("Copied to clipboard", "Close", { duration: 2000 });
	}

	addToCronometer(vision: CalorieVision): void {
		this.addingStatus.set(CronometerFoodRequestStatus.Processing);
		const customFood: CronometerFood = {
			name: vision.result.foodName,
			ingredients: vision.result.nutitionalInfo.mainIngredients.map((ingredient) => ({
				name: ingredient.name,
				amount: ingredient.gramWeight
			})),
			nutritions: [
				{ name: "Energy", amount: vision.result.nutitionalInfo.totalCalories, unit: "kcal" },
				{ name: "Total Carbs", amount: vision.result.nutitionalInfo.totalCarbs, unit: "g" },
				{ name: "Fiber", amount: vision.result.nutitionalInfo.totalFiber, unit: "g" },
				{ name: "Sugars", amount: vision.result.nutitionalInfo.totalSugars, unit: "g" },
				{ name: "Fat", amount: vision.result.nutitionalInfo.totalFat, unit: "g" },
				{ name: "Saturated", amount: vision.result.nutitionalInfo.totalSaturatedFat, unit: "g" },
				{ name: "Protein", amount: vision.result.nutitionalInfo.totalProtein, unit: "g" },
				{ name: "Sodium", amount: vision.result.nutitionalInfo.totalSalt, unit: "g" }
			]
		};

		this.customFoodService
			.createCustomFoodRequest$(customFood)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				switchMap((docId) => this.customFoodService.getCustomFoodRequests$(docId)),
				tap((customFoodRequest) => this.addingStatus.set(customFoodRequest?.status))
			)
			.subscribe();
	}
}
