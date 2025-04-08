import { Analysis } from "@aicoach/shared";
import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { Observable } from "rxjs";
import { AnalysisCardComponent } from "../analysis-card/analysis-card.component";
import { AnalysisService } from "../services/analysis.service";

@Component({
	selector: "app-analysis-result-list",
	imports: [CommonModule, AnalysisCardComponent, MatCardModule],
	templateUrl: "./analysis-result-list.component.html",
	styleUrl: "./analysis-result-list.component.scss"
})
export class AnalysisResultListComponent {
	analyses$: Observable<(Analysis | undefined)[]>;

	constructor(private analysisRequestService: AnalysisService) {
		this.analyses$ = this.analysisRequestService.getAnaylses$();
	}
}
