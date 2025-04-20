import { Food, FoodStatus } from "@aicoach/shared";
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { getDownloadURL, ref, Storage } from "@angular/fire/storage";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, EMPTY, finalize, from, switchMap, take, tap } from "rxjs";
import { EditFoodFormComponent } from "../../edit-food-form/edit-food-form.component";
import { FullscreenOverlayRef } from "../../overlay/overlay-ref";
import { FULLSCREEN_OVERLAY_DATA } from "../../overlay/overlay.token";
import { FoodService } from "../../services/food.service";

@Component({
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatIconModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		EditFoodFormComponent
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

	imageSrc = signal<string[]>([]);

	private foodService = inject(FoodService);
	private storage = inject(Storage);
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

	async copy(content?: string): Promise<void> {
		if (!content) {
			return;
		}

		navigator.clipboard.writeText(content).then(() => {
			this.snackBar.open("Copied to clipboard", "Close", { duration: 1000 });
		});
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
				switchMap((food) => {
					const promises = [];
					for (const imgPath of food?.images || []) {
						const imageRef = ref(this.storage, imgPath.url);

						promises.push(getDownloadURL(imageRef));
					}

					return from(Promise.all(promises));
				}),
				tap((urls) => {
					console.log("Image URLs:", urls);
					this.imageSrc.set(urls);
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

	deleteFood(): void {
		console.log("Not yet implemented");
	}

	generateServingSizes(): void {
		this.snackBar.open("AI serving size generation is not implemented yet", "Close");
	}

	onImageClick(imageUrl: string): void {
		window.open(imageUrl, "_blank");
	}

	close(): void {
		this.overlayRef.close();
	}
}
