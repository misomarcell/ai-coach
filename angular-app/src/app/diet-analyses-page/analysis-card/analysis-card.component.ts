import { Analysis, AnalysisRequestStatus, AnalysisResult } from "@aicoach/shared";
import { DatePipe, NgStyle } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_CARD_CONFIG, MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { take } from "rxjs";
import { AnalysisService } from "../../services/analysis.service";
import { PromptService } from "../../services/prompt.service";

@Component({
	selector: "app-analysis-card",
	imports: [NgStyle, RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
	providers: [{ provide: MAT_CARD_CONFIG, useValue: { appearance: "outlined" } }],
	templateUrl: "./analysis-card.component.html",
	styleUrl: "./analysis-card.component.scss"
})
export class AnalysisCardComponent {
	analysis = input.required<Analysis>();
	private dialog = inject(MatDialog);
	private promptService = inject(PromptService);
	private analysisService = inject(AnalysisService);

	get result(): AnalysisResult | undefined {
		return this.analysis().result;
	}

	get status(): AnalysisRequestStatus | undefined {
		return this.analysis().request.status;
	}

	onDeleteClick(): void {
		if (!this.analysis) {
			return;
		}

		const promptResult = this.promptService.prompt(
			"Delete analysis",
			"Are you sure you want to delete this analysis? This action cannot be undone.",
			"yes-no"
		);

		promptResult.subscribe((result) => {
			if (result === "yes") {
				this.analysisService.deleteAnalysis(this.analysis().id).pipe(take(1)).subscribe();
			}
		});
	}
}
