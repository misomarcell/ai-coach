import { Component, inject } from "@angular/core";
import { AnalysisRequestFormComponent } from "../analysis-request-form/analysis-request-form.component";
import { AnalysisResultListComponent } from "../analysis-result-list/analysis-result-list.component";
import { UserService } from "../services/user.service";
import { AsyncPipe } from "@angular/common";
import { EMPTY } from "rxjs";

@Component({
	imports: [AsyncPipe, AnalysisRequestFormComponent, AnalysisResultListComponent],
	templateUrl: "./diet-analyses-page.component.html",
	styleUrl: "./diet-analyses-page.component.scss"
})
export class DietAnalysesPageComponent {
	userProfile$ = inject(UserService).getUserProfile$();
	userPreferences$ = EMPTY; // TODO: Use HealthProfile
}
