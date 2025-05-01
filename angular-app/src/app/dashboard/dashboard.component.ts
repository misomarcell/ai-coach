import { Nutrition, Serving } from "@aicoach/shared";
import { Component, effect, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from "@angular/router";
import { map, Subscription } from "rxjs";
import { DailyTargetsWidgetComponent } from "../daily-targets-widget/daily-targets-widget.component";
import { DateSelectorComponent } from "../date-selector/date-selector.component";
import { AuthService } from "../services/auth.service";
import { ServingsListComponent } from "../servings/servings-list/servings-list.component";
import { ServingsService } from "../servings/servings.service";
import { MatRippleModule } from "@angular/material/core";

@Component({
	selector: "app-dashboard",
	standalone: true,
	imports: [DateSelectorComponent, ServingsListComponent, DailyTargetsWidgetComponent, MatProgressSpinnerModule, MatRippleModule],
	templateUrl: "./dashboard.component.html",
	styleUrl: "./dashboard.component.scss"
})
export class DashboardComponent {
	private route = inject(ActivatedRoute);
	private authService = inject(AuthService);
	private servingsService = inject(ServingsService);
	private servingsSubscription: Subscription | undefined;

	isLoading = signal<boolean>(false);
	selectedDate = signal<Date>(new Date());
	totalNutrition = signal<Nutrition[]>([]);
	isEmailVerified = toSignal(this.authService.getCurrentUser().pipe(map((user) => user?.emailVerified)), { initialValue: true });
	servings = signal<Serving[]>(this.route.snapshot.data["servings"] ?? {});

	updateEffect = effect(() => {
		const servings = this.servings();
		const totalNutrition = this.servingsService.getTotalNutritionAmounts(servings);
		this.totalNutrition.set(totalNutrition);
	});

	onSelectedDateChanged(date: Date) {
		const selectedDate = this.selectedDate();
		if (!this.compareDates(selectedDate, date)) {
			this.isLoading.set(true);
		}

		this.selectedDate.set(date);
		this.servingsSubscription?.unsubscribe();
		this.servingsSubscription = this.servingsService.getServingsByDate(date).subscribe((servings) => {
			this.servings.set(servings);
			this.isLoading.set(false);
		});
	}

	private compareDates(dateA: Date, dateB: Date): boolean {
		return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth() && dateA.getDate() === dateB.getDate();
	}
}
