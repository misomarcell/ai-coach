import { Nutrition, Serving } from "@aicoach/shared";
import { Component, effect, inject, PLATFORM_ID, signal } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from "@angular/router";
import { DailyTargetsWidgetComponent } from "../daily-targets-widget/daily-targets-widget.component";
import { DateSelectorComponent } from "../date-selector/date-selector.component";
import { ServingsListComponent } from "../servings/servings-list/servings-list.component";
import { ServingsService } from "../servings/servings.service";
import { finalize, take } from "rxjs";
import { isPlatformServer } from "@angular/common";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [DateSelectorComponent, ServingsListComponent, DailyTargetsWidgetComponent, MatProgressSpinnerModule, MatCardModule],
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss"
})
export class HomeComponent {
	private route = inject(ActivatedRoute);
	private servingsService = inject(ServingsService);
	private platformId = inject(PLATFORM_ID);

	isLoading = signal<boolean>(false);
	selectedDate = signal<Date>(new Date());
	totalNutrition = signal<Nutrition[]>([]);
	servings = signal<Serving[]>(this.route.snapshot.data["servings"] ?? []);

	fetchServingsEffect = effect(() => {
		if (isPlatformServer(this.platformId)) {
			return;
		}

		this.isLoading.set(true);
		this.servingsService
			.getServingsByDate(this.selectedDate())
			.pipe(
				take(1),
				finalize(() => this.isLoading.set(false))
			)
			.subscribe((data) => {
				this.servings.set(data);
				this.totalNutrition.set(this.servingsService.getTotalNutritionAmounts(data));
			});
	});
}
