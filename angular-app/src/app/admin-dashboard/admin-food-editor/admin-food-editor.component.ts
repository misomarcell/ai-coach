import { Food, FoodStatus } from "@aicoach/shared";
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AddFoodFormComponent } from "../../add-food/add-food-form/add-food-form.component";
import { FullscreenOverlayRef } from "../../overlay/overlay-ref";
import { FULLSCREEN_OVERLAY_DATA } from "../../overlay/overlay.token";
import { FoodService } from "../../services/food.service";
import { catchError, EMPTY, finalize, take, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatIconModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		AddFoodFormComponent
	],
	templateUrl: "./admin-food-editor.component.html",
	styleUrl: "./admin-food-editor.component.scss"
})
export class AdminFoodEditorComponent implements OnInit {
	foodId: string | undefined;
	food = signal<Food | undefined>(undefined);
	isLoading = signal<boolean>(true);
	adminForm: FormGroup;
	foodStatusValues = Object.values(FoodStatus);

	private foodService = inject(FoodService);
	private overlayRef = inject(FullscreenOverlayRef);
	private overlayData = inject(FULLSCREEN_OVERLAY_DATA);
	private destroyRef = inject(DestroyRef);
	private formBuilder = inject(FormBuilder);
	private snackBar = inject(MatSnackBar);

	constructor() {
		this.adminForm = this.formBuilder.group({
			isApproved: [false, Validators.required],
			isPublic: [false, Validators.required],
			status: [FoodStatus.Created, Validators.required]
		});

		takeUntilDestroyed(this.destroyRef);
	}

	ngOnInit(): void {
		this.foodId = this.overlayData?.foodId;

		if (this.foodId) {
			this.loadFood();
		} else {
			this.isLoading.set(false);
			this.snackBar.open("No food ID provided", "Close");
			this.close();
		}
	}

	loadFood(): void {
		if (!this.foodId) return;

		this.foodService
			.getFood(this.foodId)
			.pipe(
				take(1),
				tap((food) => {
					if (food) {
						this.food.set(food);
						this.adminForm.patchValue({
							isApproved: food.isApproved,
							isPublic: food.isPublic,
							status: food.status
						});
					} else {
						this.snackBar.open("Food not found", "Close");
						this.close();
					}
				}),
				finalize(() => this.isLoading.set(false)),
				catchError((err) => {
					console.error("Error loading food", err);
					this.snackBar.open("Error loading food", "Close");
					this.close();
					return EMPTY;
				})
			)
			.subscribe();
	}

	saveAdminChanges(): void {
		if (!this.foodId || !this.adminForm.valid) return;

		this.isLoading.set(true);
		this.foodService
			.updateFood(this.foodId, this.adminForm.value)
			.pipe(
				take(1),
				tap(() => this.snackBar.open("Admin settings updated", "Close")),
				finalize(() => this.isLoading.set(false)),
				catchError((err) => {
					console.error("Error updating admin settings", err);
					this.snackBar.open("Error updating admin settings", "Close");

					return EMPTY;
				})
			)
			.subscribe();
	}

	generateServingSizes(): void {
		this.snackBar.open("AI serving size generation is not implemented yet", "Close");
	}

	close(): void {
		this.overlayRef.close();
	}
}
