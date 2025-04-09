import { AnalysisPreferences, UserProfile } from "@aicoach/shared";
import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import { AnalysisService } from "../services/analysis.service";
import { TelegramConnectorService } from "../services/telegram-connector.service";
import { UserService } from "../services/user.service";
import { ServingsListComponent } from "../servings/servings-list/servings-list.component";
import { UserCardComponent } from "../user-card/user-card.component";

@Component({
	selector: "app-home",
	standalone: true,
	imports: [AsyncPipe, UserCardComponent, ServingsListComponent, MatProgressSpinnerModule, MatCardModule],
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss"
})
export class HomeComponent {
	showEditPreferences = false;
	userProfile$: Observable<UserProfile | undefined>;
	userPreferences$: Observable<AnalysisPreferences | undefined>;
	telegramUsername$: Observable<string | undefined>;

	private activatedRoute = inject(ActivatedRoute);

	constructor(
		private userService: UserService,
		private analysisService: AnalysisService,
		private telegramSerivce: TelegramConnectorService
	) {
		this.userProfile$ = this.userService.getUserProfile$(this.activatedRoute.snapshot);
		this.userPreferences$ = this.analysisService.getAnalysisPreferences$();
		this.telegramUsername$ = this.telegramSerivce.getUsername$();
	}
}
