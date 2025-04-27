import { CalorieVision } from "@aicoach/shared";
import { Component, inject, OnInit, PLATFORM_ID, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { CalorieVisionService } from "../calorie-vision.service";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { filter } from "rxjs";
import { isPlatformServer } from "@angular/common";

@Component({
	selector: "app-calorie-vision-result",
	imports: [PageTitleComponent, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatDividerModule],
	templateUrl: "./calorie-vision-result.component.html",
	styleUrl: "./calorie-vision-result.component.scss"
})
export class CalorieVisionResultComponent implements OnInit {
	private snackBar = inject(MatSnackBar);
	private paltformId = inject(PLATFORM_ID);
	private activatedRoute = inject(ActivatedRoute);
	private calorieVisionService = inject(CalorieVisionService);

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

	copy(value: string | number) {
		navigator.clipboard.writeText(`${value}`).then(() => {
			this.snackBar.open("Copied to clipboard", "", { duration: 2000 });
		});
	}
}
