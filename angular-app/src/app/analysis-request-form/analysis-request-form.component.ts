import { AiModel, AnalysisRequestStatus } from "@aicoach/shared";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatRadioModule } from "@angular/material/radio";
import { map, Subscription, take } from "rxjs";
import { AnalysisService } from "../services/analysis.service";

@Component({
	selector: "app-analysis-request-form",
	imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatExpansionModule, MatRadioModule, MatIconModule],
	templateUrl: "./analysis-request-form.component.html",
	styleUrl: "./analysis-request-form.component.scss"
})
export class AnalysisRequestFormComponent implements OnInit {
	isDisabled = false;
	services: { label: string; value: AiModel }[] = [
		{
			label: "OpenAI (gtp-4o)",
			value: "gpt-4o"
		},
		{
			label: "Anthropic (claude-3-7-sonnet)",
			value: "claude-3-7-sonnet-latest"
		}
	];
	formGroup = new FormGroup({
		service: new FormControl<AiModel>("gpt-4o")
	});

	private destroyRef = inject(DestroyRef);

	constructor(private analysisService: AnalysisService) {}

	ngOnInit(): void {
		this.analysisService
			.getAnalysesByStatus$([AnalysisRequestStatus.Created, AnalysisRequestStatus.Processing])
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				map((ongoing) => ongoing.length > 0)
			)
			.subscribe((isOngoing) => (this.isDisabled = isOngoing));
	}

	onServiceChange(model: AiModel): void {
		this.formGroup.get("service")?.setValue(model);
	}

	onRequestClick(): Subscription | undefined {
		const { service } = this.formGroup.value;
		if (!service) {
			return;
		}

		this.isDisabled = true;

		return this.analysisService.createAnalysisRequest$(service).pipe(take(1)).subscribe();
	}
}
