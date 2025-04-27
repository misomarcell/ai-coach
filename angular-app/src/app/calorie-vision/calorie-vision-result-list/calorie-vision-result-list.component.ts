import { CronometerFoodRequestStatus } from "@aicoach/shared";
import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { CalorieVisionService } from "../calorie-vision.service";
import { MatDialog } from "@angular/material/dialog";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../../prompt-dialog/prompt-dialog.component";
import { filter, switchMap, take, tap } from "rxjs";
import { MatRippleModule } from "@angular/material/core";

@Component({
	selector: "app-calorie-vision-result-list",
	imports: [
		PageTitleComponent,
		DatePipe,
		RouterLink,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatRippleModule,
		MatIconModule,
		MatSnackBarModule,
		MatExpansionModule,
		MatDividerModule
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./calorie-vision-result-list.component.html",
	styleUrl: "./calorie-vision-result-list.component.scss"
})
export class CalorieVisionResultListComponent {
	private calorieVisionService = inject(CalorieVisionService);
	private activatedRoute = inject(ActivatedRoute);
	private snackBar = inject(MatSnackBar);
	private dialog = inject(MatDialog);

	addingStatus = signal<CronometerFoodRequestStatus | undefined>(undefined);
	visionItems = toSignal(this.calorieVisionService.getHistory(), { initialValue: this.activatedRoute.snapshot.data["visionHistory"] });

	onDeleteClick(visionId: string) {
		if (!visionId) {
			return;
		}

		const dialogRef = this.dialog.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: {
				title: "Delete Calorie Vision",
				message: "Are you sure you want to delete this Calorie Vision?",
				buttonLayout: "yes-no"
			}
		});

		dialogRef
			.afterClosed()
			.pipe(
				filter((result) => result === "yes"),
				take(1),
				switchMap(() => this.calorieVisionService.deleteCalorieVision(visionId)),
				tap(() => this.snackBar.open("Item deleted", ""))
			)
			.subscribe();
	}
}
