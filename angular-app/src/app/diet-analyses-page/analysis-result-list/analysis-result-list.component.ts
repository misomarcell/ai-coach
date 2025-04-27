import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AnalysisService } from "../../services/analysis.service";
import { HealthProfileService } from "../../services/health-profile.service";
import { UserService } from "../../services/user.service";
import { AnalysisCardComponent } from "../analysis-card/analysis-card.component";
import { AnalysisRequestFormComponent } from "../analysis-request-form/analysis-request-form.component";
import { RouterLink } from "@angular/router";

@Component({
	selector: "app-analysis-result-list",
	imports: [PageTitleComponent, AnalysisRequestFormComponent, AnalysisCardComponent, RouterLink],
	templateUrl: "./analysis-result-list.component.html",
	styleUrl: "./analysis-result-list.component.scss"
})
export class AnalysisResultListComponent {
	private userService = inject(UserService);
	private healthProfileService = inject(HealthProfileService);
	private analysisRequestService = inject(AnalysisService);

	userProfile = toSignal(this.userService.getUserProfile$());
	healthProfile = toSignal(this.healthProfileService.getHealthProfile());
	analyses = toSignal(this.analysisRequestService.getAnaylses());
}
