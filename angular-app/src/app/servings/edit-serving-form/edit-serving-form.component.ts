import { slideInOut } from "@aicoach/animations";
import { FULLSCREEN_OVERLAY_DATA, FullscreenOverlayRef } from "@aicoach/overlay";
import { Food, Nutrition, Serving, servingCategories, ServingCategory, ServingFood, ServingSize } from "@aicoach/shared";
import { CustomDateAdapter } from "@aicoach/utils/date-adapter.util";
import { Platform } from "@angular/cdk/platform";
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxMaskDirective, provideNgxMask } from "ngx-mask";
import { filter, switchMap, take, tap } from "rxjs";
import { NutritionLabelComponent } from "../../nutrition-label/nutrition-label.component";
import { NutritionListComponent } from "../../nutrition-list/nutrition-list.component";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../../prompt-dialog/prompt-dialog.component";
import { FoodService } from "../../services/food.service";
import { ServingsService } from "../servings.service";

interface PrefillOptions {
	servingAmount?: number;
	servingSize?: ServingSize;
	category?: ServingCategory;
	created?: Date;
}

@Component({
	standalone: true,
	imports: [
		NgxMaskDirective,
		NutritionLabelComponent,
		NutritionListComponent,
		ReactiveFormsModule,
		MatDialogModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatIconModule,
		MatChipsModule,
		MatDatepickerModule,
		MatNativeDateModule
	],
	providers: [
		provideNgxMask({ validation: false, dropSpecialCharacters: false }),
		{ provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
		{ provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
	],
	animations: [slideInOut],
	host: {
		"[@slideInOut]": ""
	},
	templateUrl: "./edit-serving-form.component.html",
	styleUrl: "./edit-serving-form.component.scss"
})
export class EditServingFormComponent implements OnInit, AfterViewInit, OnDestroy {
	private formSubscription: any;
	form: FormGroup;
	servingCategories = servingCategories;
	servingSizes: ServingSize[] = [];

	isSubmitting = signal<boolean>(false);
	nutritions = signal<Nutrition[]>([]);
	food = signal<Food | ServingFood | undefined>(undefined);
	serving = signal<Serving | undefined>(undefined);

	get dietaryFlags(): string[] {
		return this.food()?.dietaryFlags || [];
	}

	dialogService = inject(MatDialog);
	overlayRef = inject(FullscreenOverlayRef<EditServingFormComponent>);
	overlayData = inject<{ foodId?: string; serving?: Serving }>(FULLSCREEN_OVERLAY_DATA);

	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);
	private formBuilder = inject(FormBuilder);
	private snackService = inject(MatSnackBar);
	private servingsService = inject(ServingsService);
	private foodService = inject(FoodService);

	@ViewChild("amount", { static: false }) amountField: ElementRef<HTMLInputElement> | undefined;
	constructor() {
		const today = new Date();
		this.form = this.formBuilder.group({
			amount: [100, [Validators.required, Validators.min(0.01)]],
			servingSize: [[], Validators.required],
			date: [today, Validators.required],
			time: [this.getFormattedTime(today), [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
			category: [this.getDefaultCategory(), Validators.required]
		});

		this.formSubscription = this.form.valueChanges.subscribe(() => {
			this.updateNutritions();
		});
	}

	ngOnDestroy(): void {
		if (this.formSubscription) {
			this.formSubscription.unsubscribe();
		}
	}

	ngOnInit(): void {
		if (this.overlayData.serving) {
			this.serving.set(this.overlayData.serving);
			this.servingSizes = [this.overlayData.serving.servingSize];
			this.food.set(this.overlayData.serving?.food);
			this.nutritions.set(this.servingsService.getServingNutritions(this.overlayData.serving));
			this.prefillForm({ ...this.overlayData.serving });

			if (this.overlayData.serving.isEditable === false) {
				this.form.disable();
			} else if (this.overlayData.serving.isFinalized) {
				this.form.get("amount")?.disable();
				this.form.get("servingSize")?.disable();
			}
		}

		if (!this.overlayData.foodId) {
			return;
		}

		this.foodService
			.getFood(this.overlayData.foodId)
			.pipe(
				filter((food) => !!food),
				tap((food) => {
					food.servingSizes.forEach((size) => {
						if (!this.servingSizes.some((s) => s.name === size.name)) {
							this.servingSizes.push(size);
						}
					});

					this.prefillForm();
					this.nutritions.set(this.servingsService.getFoodNutritions(food));
				})
			)
			.subscribe((food) => this.food.set(food));
	}

	ngAfterViewInit(): void {
		setTimeout(() => this.amountField?.nativeElement.click(), 300);
	}

	prefillForm(options?: PrefillOptions): void {
		const createdDate = options?.created || new Date();
		const formattedTime = this.getFormattedTime(createdDate);

		let servingSize = options?.servingSize;
		if (!servingSize && this.servingSizes.length > 0) {
			servingSize = this.servingSizes[0];
		}

		this.form.patchValue({
			amount: options?.servingAmount || 100,
			servingSize: servingSize,
			category: options?.category || this.getDefaultCategory(),
			date: createdDate,
			time: formattedTime
		});
	}

	onAddServing(): void {
		const food = this.food();
		if (!food || this.form.invalid || this.isSubmitting()) {
			return;
		}

		this.isSubmitting.set(true);
		this.addServing(food);
	}

	onSaveServing(): void {
		const _serving = this.serving();
		const formValues = this.form.getRawValue();

		if (!_serving?.id || this.form.invalid || this.isSubmitting()) {
			return;
		}

		this.isSubmitting.set(true);

		const createdTime = this.combineDateAndTime(formValues.date, formValues.time);
		const servingData: Partial<Serving> = {
			...this.serving(),
			servingSize: formValues.servingSize,
			servingAmount: formValues.amount,
			category: formValues.category as ServingCategory,
			created: createdTime || new Date()
		};

		this.servingsService
			.updateServing(_serving.id, servingData)
			.pipe(
				take(1),
				tap(() => {
					this.snackService.open("Serving updated successfully!", "Close", { duration: 3000 });
				}),
				switchMap(() => this.router.navigate(["/home"])),
				tap(() => {
					this.isSubmitting.set(false);
					this.closeOverlay();
				})
			)
			.subscribe({
				error: (err) => {
					this.snackService.open("Error updating serving. Please try again.", "Close", { duration: 3000 });
					this.isSubmitting.set(false);
					console.error("Error updating serving:", err);
				}
			});
	}

	async onDeleteServing(serving: Serving) {
		if (!serving || this.isSubmitting()) {
			return;
		}

		const dialogComponent = await import("../../prompt-dialog/prompt-dialog.component").then((m) => m.PromptDialogComponent);
		const dialogRef = this.dialogService.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(dialogComponent, {
			data: {
				title: "Delete Serving",
				message: "Are you sure you want to delete this serving?",
				buttonLayout: "yes-no"
			}
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result === "yes") {
				this.isSubmitting.set(true);
				this.servingsService
					.delete(serving.id)
					.pipe(
						tap(() => {
							this.snackService.open("Serving deleted successfully!", "Close", { duration: 3000 });
						}),
						switchMap(() => this.router.navigate(["/home"])),
						take(1)
					)
					.subscribe({
						next: () => {
							this.isSubmitting.set(false);
							this.closeOverlay();
						},
						error: (err) => {
							this.snackService.open("Error deleting serving. Please try again.", "Close", { duration: 3000 });
							this.isSubmitting.set(false);
							console.error("Error deleting serving:", err);
						}
					});
			}
		});
	}

	async onCopyServing(serving: Serving) {
		if (!serving || this.isSubmitting()) {
			return;
		}

		const dialogComponent = await import("../../prompt-dialog/prompt-dialog.component").then((m) => m.PromptDialogComponent);
		const dialogRef = this.dialogService.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(dialogComponent, {
			data: {
				title: "Copy Serving",
				message: "Are you sure you want to copy this serving for today?",
				buttonLayout: "yes-no"
			}
		});

		dialogRef.afterClosed().subscribe((result) => {
			if (result === "yes") {
				this.isSubmitting.set(true);

				const formValues = this.form.getRawValue();
				this.addServing(serving.food, {
					amount: formValues.amount,
					servingSize: formValues.servingSize,
					category: formValues.category,
					date: new Date()
				});
			}
		});
	}

	closeOverlay(): void {
		this.overlayRef?.close(false);
	}

	private addServing(food: ServingFood, options?: { amount?: number; servingSize?: any; category?: ServingCategory; date?: Date }): void {
		const formValues = this.form.getRawValue();
		const selectedDate = options?.date || this.getSelectedDate();

		this.servingsService
			.addServing(
				{
					food,
					category: options?.category || formValues.category,
					servingSize: options?.servingSize || formValues.servingSize,
					servingAmount: options?.amount || formValues.amount
				},
				selectedDate
			)
			.pipe(
				take(1),
				tap(() => {
					this.snackService.open("Serving added successfully!", "Close", { duration: 3000 });
				}),
				switchMap(() => this.router.navigate(["/home"])),
				tap(() => {
					this.isSubmitting.set(false);
					this.closeOverlay();
				})
			)
			.subscribe({
				error: (err) => {
					this.snackService.open("Error adding serving. Please try again.", "Close", { duration: 3000 });
					this.isSubmitting.set(false);
					console.error("Error adding serving:", err);
				}
			});
	}

	private getSelectedDate(): Date {
		return this.combineDateAndTime(this.form.value.date, this.form.value.time) || new Date();
	}

	private getFormattedTime(date: Date): string {
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false
		});
	}

	private getDefaultCategory(): ServingCategory {
		const preselectedCategorty = this.activatedRoute.snapshot.queryParams["group"];
		if (preselectedCategorty) {
			return preselectedCategorty;
		}

		const now = new Date();
		const hour = now.getHours();

		if (hour < 11) {
			return "Breakfast";
		} else if (hour < 18) {
			return "Lunch";
		} else {
			return "Dinner";
		}
	}

	private updateNutritions(): void {
		const formValues = this.form.getRawValue();
		const serving = this.serving();
		const food = this.food();

		if (serving && formValues.servingSize && formValues.amount) {
			this.nutritions.set(
				this.servingsService.getServingNutritions({
					...serving,
					servingAmount: formValues.amount,
					servingSize: formValues.servingSize
				})
			);
		} else if (food && formValues.amount) {
			this.nutritions.set(
				this.servingsService.getFoodNutritions(food).map((n) => ({ ...n, amount: n.amount * (formValues.amount / 100) }))
			);
		}
	}

	private combineDateAndTime(date: Date, timeString: string): Date | null {
		if (!date || !timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
			return null;
		}

		const parts = timeString.split(":");
		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);

		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			console.error("Invalid hours or minutes value in the time string.");
			return null;
		}

		const resultDate = new Date(date);
		resultDate.setHours(hours, minutes, 0, 0);

		return resultDate;
	}
}
