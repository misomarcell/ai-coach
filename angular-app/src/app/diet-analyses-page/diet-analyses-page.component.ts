import { Component, inject } from "@angular/core";
import { AnalysisRequestFormComponent } from "../analysis-request-form/analysis-request-form.component";
import { AnalysisResultListComponent } from "../analysis-result-list/analysis-result-list.component";
import { UserService } from "../services/user.service";
import { AnalysisService } from "../services/analysis.service";
import { AsyncPipe } from "@angular/common";

@Component({
	imports: [AsyncPipe, AnalysisRequestFormComponent, AnalysisResultListComponent],
	templateUrl: "./diet-analyses-page.component.html",
	styleUrl: "./diet-analyses-page.component.scss"
})
export class DietAnalysesPageComponent {
	userProfile$ = inject(UserService).getUserProfile$();
	userPreferences$ = inject(AnalysisService).getAnalysisPreferences$();
}
