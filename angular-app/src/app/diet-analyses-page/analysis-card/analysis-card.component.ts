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
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../../prompt-dialog/prompt-dialog.component";
import { AnalysisService } from "../../services/analysis.service";

@Component({
	selector: "app-analysis-card",
	imports: [NgStyle, RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
	providers: [{ provide: MAT_CARD_CONFIG, useValue: { appearance: "outlined" } }],
	templateUrl: "./analysis-card.component.html",
	styleUrl: "./analysis-card.component.scss"
})
export class AnalysisCardComponent {
	analysis = input.required<Analysis>();
	dialog = inject(MatDialog);
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

		const dialogRef = this.dialog.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: {
				title: "Delete analysis",
				message: "Are you sure you want to delete this analysis? This action cannot be undone.",
				buttonLayout: "yes-no"
			}
		});

		dialogRef
			.afterClosed()
			.pipe(take(1))
			.subscribe((result) => {
				if (result === "yes") {
					this.analysisService.deleteAnalysis(this.analysis().id).pipe(take(1)).subscribe();
				}
			});
	}
}
