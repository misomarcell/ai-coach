import { Component, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { AnalysisCardComponent } from "../analysis-card/analysis-card.component";
import { AnalysisRequestFormComponent } from "../analysis-request-form/analysis-request-form.component";
import { AnalysisService } from "../services/analysis.service";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
	selector: "app-analysis-result-list",
	imports: [AnalysisRequestFormComponent, AnalysisCardComponent, MatCardModule],
	templateUrl: "./analysis-result-list.component.html",
	styleUrl: "./analysis-result-list.component.scss"
})
export class AnalysisResultListComponent {
	private analysisRequestService = inject(AnalysisService);

	analyses = toSignal(this.analysisRequestService.getAnaylses());
}
