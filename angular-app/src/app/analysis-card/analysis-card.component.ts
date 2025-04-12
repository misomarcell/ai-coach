import { Analysis, AnalysisRequestStatus, AnalysisResult } from "@aicoach/shared";
import { DatePipe, NgStyle } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_CARD_CONFIG, MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { take } from "rxjs";

import { AnalysisService } from "../services/analysis.service";

@Component({
	selector: "app-analysis-card",
	imports: [NgStyle, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
	providers: [{ provide: MAT_CARD_CONFIG, useValue: { appearance: "outlined" } }],
	templateUrl: "./analysis-card.component.html",
	styleUrl: "./analysis-card.component.scss"
})
export class AnalysisCardComponent {
	get result(): AnalysisResult | undefined {
		return this.analysis?.result;
	}

	get status(): AnalysisRequestStatus | undefined {
		return this.analysis?.request.status;
	}

	@Input({ required: true }) analysis: Analysis | undefined;
	constructor(private analysisService: AnalysisService) {}

	onDeleteClick(): void {
		if (!this.analysis) {
			return;
		}

		this.analysisService.deleteAnalysis(this.analysis.id).pipe(take(1)).subscribe();
	}
}
