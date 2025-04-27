import { OverlayService } from "@aicoach/overlay";
import { CalorieVision, Serving } from "@aicoach/shared";
import { isPlatformServer } from "@angular/common";
import { Component, inject, OnInit, PLATFORM_ID, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatRippleModule } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute } from "@angular/router";
import { filter } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { PromptDialogComponent } from "../../prompt-dialog/prompt-dialog.component";
import { EditServingFormComponent } from "../../servings/edit-serving-form/edit-serving-form.component";
import { CalorieVisionService } from "../calorie-vision.service";
import { NutritionLabelComponent } from "../../nutrition-label/nutrition-label.component";

@Component({
	selector: "app-calorie-vision-result",
	imports: [PageTitleComponent, NutritionLabelComponent, MatButtonModule, MatProgressSpinnerModule, MatRippleModule, MatIconModule],
	templateUrl: "./calorie-vision-result.component.html",
	styleUrl: "./calorie-vision-result.component.scss"
})
export class CalorieVisionResultComponent implements OnInit {
	private snackBar = inject(MatSnackBar);
	private paltformId = inject(PLATFORM_ID);
	private activatedRoute = inject(ActivatedRoute);
	private calorieVisionService = inject(CalorieVisionService);
	private overlayService = inject(OverlayService);
	private dialog = inject(MatDialog);

	documentId = this.activatedRoute.snapshot.paramMap.get("visionId")!;
	calorieVision = signal<CalorieVision>(this.activatedRoute.snapshot.data["calorieVision"]);
	imageSrc = toSignal<string | undefined>(this.calorieVisionService.getImageUrlFromFileName(this.calorieVision()?.fileName), {
		initialValue: undefined
	});

	ngOnInit(): void {
		if (isPlatformServer(this.paltformId)) {
			return;
		}

		if (!this.calorieVision() || !this.calorieVision()?.result) {
			this.calorieVisionService
				.getCalorieVision(this.documentId)
				.pipe(filter((vision) => !!vision))
				.subscribe((vision) => this.calorieVision.set(vision));
		}
	}

	async onAddClick(): Promise<void> {
		const serving = this.getFoodAsServing();
		await this.overlayService.open(EditServingFormComponent, {
			data: { serving }
		});
	}

	onScoreClick() {
		this.dialog.open(PromptDialogComponent, {
			data: {
				title: "About scoring",
				message:
					"This score reflects the personalized nutritional value of the food. A higher score can indicates better nutritional value or a better fit to your needs and goals.",
				buttonLayout: "ok"
			}
		});
	}

	copy(value: string | number) {
		navigator.clipboard.writeText(`${value}`).then(() => {
			this.snackBar.open("Copied to clipboard", "", { duration: 2000 });
		});
	}

	private getFoodAsServing(): Partial<Serving> {
		const result = this.calorieVision().result;
		if (!result) {
			throw new Error("No result found");
		}

		return {
			servingAmount: 1,
			servingSize: {
				name: "Serving",
				gramWeight: result.foodWeight,
				isAiEstimate: true
			},
			food: {
				name: result.foodName,
				category: result.foodCategory,
				isApproved: false,
				nutritions: result.nutritions,
				source: "Calorie Vision",
				tags: ["calorie-vision"]
			}
		};
	}
}
