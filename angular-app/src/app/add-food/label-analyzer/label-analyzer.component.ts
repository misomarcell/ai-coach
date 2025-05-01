import { Food, FoodStatus } from "@aicoach/shared";
import { Component, inject, input, output, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { filter, forkJoin, switchMap, tap } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { FoodService } from "../../services/food.service";
import { LoadingStatus } from "../add-food.component";

interface ImageUpload {
	file: File | null;
	preview: string | null;
	uploadPercent: number | null;
	url: string | null;
}

@Component({
	selector: "app-label-analyzer",
	standalone: true,
	imports: [
		PageTitleComponent,
		MatCardModule,
		MatExpansionModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatSnackBarModule
	],
	templateUrl: "./label-analyzer.component.html",
	styleUrl: "./label-analyzer.component.scss"
})
export class LabelAnalyzerComponent {
	isPackagePanelOpen = true;
	isLabelPanelOpen = false;
	packageImage = signal<ImageUpload>({
		file: null,
		preview: null,
		uploadPercent: null,
		url: null
	});

	labelImage = signal<ImageUpload>({
		file: null,
		preview: null,
		uploadPercent: null,
		url: null
	});

	foodId = input<string>();
	analysisComplete = output<Partial<Food>>();
	loadingStatus = signal<LoadingStatus | null>(null);

	private foodService = inject(FoodService);
	private snackBar = inject(MatSnackBar);

	onFileSelected(event: Event, imageType: "package" | "label") {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const selectedFile = input.files[0];

			if (!selectedFile.type.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/)) {
				this.snackBar.open("Please select a valid image file (JPEG, PNG, GIF, BMP, WEBP)", "Close", {
					duration: 5000
				});
				this.resetFileInput(imageType);
				return;
			}

			if (selectedFile.size > 10 * 1024 * 1024) {
				this.snackBar.open("Image is too large. Maximum size is 10MB", "Close", {
					duration: 5000
				});
				this.resetFileInput(imageType);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				if (imageType === "package") {
					this.isPackagePanelOpen = false;
					this.isLabelPanelOpen = true;
					this.packageImage.update((current) => ({
						...current,
						file: selectedFile,
						preview: reader.result as string
					}));
				} else {
					this.labelImage.update((current) => ({
						...current,
						file: selectedFile,
						preview: reader.result as string
					}));
				}
			};

			reader.readAsDataURL(selectedFile);
		}
	}

	resetFileInput(imageType: "package" | "label") {
		if (imageType === "package") {
			this.packageImage.update(() => ({
				url: null,
				file: null,
				preview: null,
				uploadPercent: null
			}));
		} else {
			this.labelImage.update(() => ({
				url: null,
				file: null,
				preview: null,
				uploadPercent: null
			}));
		}
	}

	uploadImages() {
		if (!this.foodId()) {
			console.error("Food ID is not set. Cannot upload images.");
			return;
		}

		if (!this.packageImage().file || !this.labelImage().file) {
			this.snackBar.open("Both product package and nutrition label images are required", "Close", {
				duration: 5000
			});
			return;
		}

		this.loadingStatus.set(LoadingStatus.UploadingImages);

		const labelUpload = this.foodService.uploadProductImage(this.foodId()!, this.labelImage().file!, "label");
		const packageUpload = this.foodService.uploadProductImage(this.foodId()!, this.packageImage().file!, "package");

		forkJoin([packageUpload, labelUpload])
			.pipe(
				tap(() => this.loadingStatus.set(LoadingStatus.AnalyzingLabel)),
				switchMap(() =>
					this.foodService.getFood(this.foodId()!).pipe(
						filter((food) => !!food),
						tap((food) => this.handleLabelAnalysisResult(food))
					)
				)
			)
			.subscribe();
	}

	areImagesReady(): boolean {
		return !!this.packageImage().file && !!this.labelImage().file;
	}

	skipAnalysis() {
		const foodId = this.foodId();
		if (!foodId) {
			console.error("Food ID is not set. Cannot skip analysis.");
			return;
		}

		this.analysisComplete.emit({
			id: foodId,
			status: FoodStatus.Prefilled
		});
	}

	private handleLabelAnalysisResult(food: Food): void {
		if (food.status === FoodStatus.Prefilled) {
			this.loadingStatus.set(null);
			this.analysisComplete.emit(food);
		} else if (food.status === FoodStatus.Invalid) {
			this.loadingStatus.set(null);
			this.snackBar.open("These photos couldn't be processed. Please try using different photos.", "Close", {
				duration: 5000
			});
		}
	}
}
