import { Food, FoodStatus } from "@aicoach/shared";
import { Component, DestroyRef, effect, inject, OnInit, signal } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { LabelAnalyzerComponent } from "./label-analyzer/label-analyzer.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { FoodService } from "../services/food.service";
import { ActivatedRoute } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EditFoodFormComponent } from "../edit-food-form/edit-food-form.component";
import { PageTitleComponent } from "../page-title/page-title.component";

export enum LoadingStatus {
	InitDocument = "InitDocument",
	UploadingImages = "UploadingImages",
	AnalyzingLabel = "AnalyzingLabel"
}

@Component({
	standalone: true,
	imports: [PageTitleComponent, LabelAnalyzerComponent, EditFoodFormComponent, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
	templateUrl: "./add-food.component.html",
	styleUrl: "./add-food.component.scss"
})
export class AddFoodComponent implements OnInit {
	loadingStatus = signal<LoadingStatus | null>(LoadingStatus.InitDocument);
	analysisResult = signal<Partial<Food> | undefined>(undefined);
	foodId = signal<string | undefined>(undefined);

	private destroyRef = inject(DestroyRef);
	private foodService = inject(FoodService);
	private activatedRoute = inject(ActivatedRoute);

	constructor() {
		effect(() => {
			if (this.foodId()) {
				this.loadingStatus.set(null);
			}
		});
	}

	ngOnInit(): void {
		this.foodService.getNewFoodDocumentId().subscribe((documentId) => {
			this.loadingStatus.set(null);
			this.foodId.set(documentId);
		});
		this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
			if (params["barcode"]) {
				this.analysisResult.update((result) => ({ ...result, barcode: params["barcode"] }));
			}
		});
	}

	onAnalyzisComplete(analysisResult: Partial<Food>) {
		this.analysisResult.update((oldValue) => ({
			id: this.foodId(),
			...oldValue,
			...analysisResult
		}));
	}

	skipAnalysis() {
		this.analysisResult.set({
			id: this.foodId(),
			status: FoodStatus.Prefilled
		});
	}

	onTryAgainClick() {
		this.analysisResult.set(undefined);
	}
}
