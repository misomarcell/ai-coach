import { popInEffect } from "@aicoach/animations";
import { FULLSCREEN_OVERLAY_DATA, FullscreenOverlayRef } from "@aicoach/overlay";
import { DietaryFlag, Food, Nutrition, Serving, servingCategories, ServingCategory, ServingFood, ServingSize } from "@aicoach/shared";
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
import { catchError, EMPTY, filter, finalize, switchMap, take, tap } from "rxjs";
import { DietaryFlagsComponent } from "../../dietary-flags/dietary-flags.component";
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
	comment?: string;
}

@Component({
	standalone: true,
	imports: [
		NgxMaskDirective,
		DietaryFlagsComponent,
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
	animations: [popInEffect],
	host: {
		"[@popInEffect]": ""
	},
	templateUrl: "./edit-serving-form.component.html",
	styleUrl: "./edit-serving-form.component.scss"
})
export class EditServingFormComponent implements OnInit, AfterViewInit, OnDestroy {
	private formSubscription: any;
	form: FormGroup;
	servingCategories = servingCategories;
	servingSizes: ServingSize[] = [];
	productBarcode: string | undefined = undefined;

	isOpenComment = signal<boolean>(false);
	isSubmitting = signal<boolean>(false);
	nutritions = signal<Nutrition[]>([]);
	food = signal<Food | ServingFood | undefined>(undefined);
	serving = signal<Serving | undefined>(undefined);

	get dietaryFlags(): DietaryFlag[] {
		return this.food()?.dietaryFlags || [];
	}

	get per(): string {
		const formValues = this.form.getRawValue();

		return `${formValues.amount} ${formValues.servingSize.name}`;
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
			amount: ["", [Validators.required, Validators.min(0.01)]],
			servingSize: [[], Validators.required],
			date: [this.getDefaultDate(), Validators.required],
			time: [this.getFormattedTime(today), [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
			category: [this.getDefaultCategory(), Validators.required],
			comment: [""]
		});

		this.formSubscription = this.form.valueChanges.subscribe(() => this.updateNutritions());
	}

	ngOnInit(): void {
		if (this.overlayData.serving) {
			this.prefillServingData(this.overlayData.serving);
		} else if (this.overlayData.foodId) {
			this.prefillFoodData(this.overlayData.foodId);
		} else {
			this.snackService.open("This food can't be added right now.", "Close");
			this.closeOverlay();
		}
	}

	ngAfterViewInit(): void {
		setTimeout(() => this.amountField?.nativeElement.click(), 500);
	}

	ngOnDestroy(): void {
		if (this.formSubscription) {
			this.formSubscription.unsubscribe();
		}
	}

	prefillForm(options?: PrefillOptions): void {
		const createdDate = options?.created || this.getDefaultDate();
		const formattedTime = this.getFormattedTime(createdDate);

		let servingSize = options?.servingSize;
		if (!servingSize && this.servingSizes.length > 0) {
			servingSize = this.servingSizes[this.servingSizes.length - 1];
		}

		if (options?.comment) {
			this.isOpenComment.set(true);
		}

		this.form.patchValue({
			amount: options?.servingAmount || (servingSize?.gramWeight === 1 ? 100 : 1),
			servingSize: servingSize,
			category: options?.category || this.getDefaultCategory(),
			comment: options?.comment || "",
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
		this.addServing(food, { ...this.serving() });
	}

	onServingSizeChange(servingSize: ServingSize): void {
		this.form.get("amount")?.setValue(servingSize.gramWeight === 1 ? 100 : 1);
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
			comment: formValues.comment,
			created: createdTime || new Date()
		};

		this.servingsService
			.updateServing(_serving.id, servingData)
			.pipe(
				take(1),
				tap(() => {
					this.snackService.open("Serving updated successfully!", "Close");
				}),
				switchMap(() => this.router.navigate(["/dashboard"])),
				finalize(() => {
					this.isSubmitting.set(false);
					this.closeOverlay();
				})
			)
			.subscribe({
				error: (err) => {
					this.snackService.open("Error updating serving. Please try again.", "Close");
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
							this.snackService.open("Serving deleted successfully!", "Close");
						}),
						switchMap(() => this.router.navigate(["/dashboard"])),
						take(1)
					)
					.subscribe({
						next: () => {
							this.isSubmitting.set(false);
							this.closeOverlay();
						},
						error: (err) => {
							this.snackService.open("Error deleting serving. Please try again.", "Close");
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
					servingAmount: formValues.amount,
					servingSize: formValues.servingSize,
					category: formValues.category,
					created: new Date()
				});
			}
		});
	}

	async openProductPage(): Promise<boolean> {
		this.overlayRef?.close();
		return this.router.navigate(["foods/view-product", this.productBarcode]);
	}

	onReportClick(): void {
		const food = this.food();
		const queryParams: any = {};
		if (this.productBarcode) {
			queryParams.barcode = this.productBarcode;
		}

		if (food && food.id) {
			queryParams.foodId = food.id;
		}

		if (food && food.name) {
			queryParams.title = food.name;
		}

		queryParams.returnUrl = encodeURIComponent(this.router.url);

		this.router.navigate(["/report"], { queryParams });
		this.overlayRef?.close();
	}

	closeOverlay(): void {
		this.overlayRef?.close();
	}

	private prefillServingData(serving: Serving) {
		if (!serving) {
			return;
		}

		this.servingSizes = this.combineServingSizes([
			serving.servingSize,
			...(serving.food.servingSizes ? serving.food.servingSizes : [])
		]);

		const servingData: Serving = {
			...serving,
			servingSize: serving.servingSize || this.servingSizes[0]
		};

		this.serving.set(serving);
		this.food.set(serving?.food);
		this.nutritions.set(this.servingsService.getServingNutritions(servingData));
		this.productBarcode = serving.food.barcode;
		this.prefillForm({ ...servingData });

		if (serving.isEditable === false) {
			this.form.disable();
		} else if (serving.isFinalized) {
			this.form.get("amount")?.disable();
			this.form.get("servingSize")?.disable();
		}
	}

	private combineServingSizes(servingSizes: ServingSize[]): ServingSize[] {
		const combinedServingSizes: ServingSize[] = [];
		servingSizes
			.filter((s) => !!s)
			.forEach((size) => {
				if (!combinedServingSizes.some((s) => s.name === size.name)) {
					combinedServingSizes.push(size);
				}
			});

		return combinedServingSizes;
	}

	private prefillFoodData(foodId: string) {
		this.foodService
			.getFood(foodId)
			.pipe(
				catchError(() => {
					this.snackService.open("This food can't be added right now.", "Close");
					this.closeOverlay();

					return EMPTY;
				}),
				filter((food) => !!food),
				tap((food) => this.food.set(food)),
				tap((food) => {
					this.productBarcode = food.barcode;
					food.servingSizes.forEach((size) => {
						if (!this.servingSizes.some((s) => s.name === size.name)) {
							this.servingSizes.push(size);
						}
					});
				}),
				tap(() => this.prefillForm()),
				tap(() => this.updateNutritions())
			)
			.subscribe();
	}

	private addServing(food: ServingFood, servingData?: Partial<Serving>): void {
		const formValues = this.form.getRawValue();
		const selectedDate = servingData?.created || this.getSelectedDate();

		this.servingsService
			.addServing(
				{
					food,
					category: servingData?.category || formValues.category,
					servingSize: servingData?.servingSize || formValues.servingSize,
					servingAmount: servingData?.servingAmount || formValues.amount,
					isCalorieVision: servingData?.isCalorieVision || false,
					comment: formValues.comment
				},
				selectedDate
			)
			.pipe(
				take(1),
				tap(() => this.snackService.open("Serving added successfully!", "Close")),
				switchMap(() => this.router.navigate(["/dashboard"])),
				finalize(() => {
					this.isSubmitting.set(false);
					this.closeOverlay();
				})
			)
			.subscribe({
				error: (err) => {
					this.snackService.open("Error adding serving. Please try again.", "Close");
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

	private getDefaultDate(): Date {
		const preselectedDate = this.activatedRoute.snapshot.queryParams["date"];
		if (preselectedDate) {
			return new Date(preselectedDate);
		}

		return new Date();
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
		} else if (food && formValues.servingSize && formValues.amount != null) {
			const { amount, servingSize } = formValues;
			const gw = servingSize.gramWeight;
			const factor = gw != null ? (amount * gw) / 100 : amount / 100;

			this.nutritions.set(
				this.servingsService.getFoodNutritions(food).map((n) => ({
					...n,
					amount: n.amount * factor
				}))
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
