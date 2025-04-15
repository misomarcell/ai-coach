import { slideInOut } from "@aicoach/animations";
import { FULLSCREEN_OVERLAY_DATA, FullscreenOverlayRef } from "@aicoach/overlay";
import { Food, Serving, servingCategories, ServingCategory, ServingFood, ServingSize } from "@aicoach/shared";
import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { filter, startWith, switchMap, take, tap } from "rxjs";
import { NutritionLabelComponent } from "../../nutrition-label/nutrition-label.component";
import { NutritionListComponent } from "../../nutrition-list/nutrition-list.component";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../../prompt-dialog/prompt-dialog.component";
import { FoodService } from "../../services/food.service";
import { ServingsService } from "../servings.service";

@Component({
	standalone: true,
	imports: [
		NutritionLabelComponent,
		NutritionListComponent,
		ReactiveFormsModule,
		MatDialogModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatIconModule,
		MatChipsModule
	],
	animations: [slideInOut],
	host: {
		"[@slideInOut]": ""
	},
	templateUrl: "./edit-serving-form.component.html",
	styleUrl: "./edit-serving-form.component.scss"
})
export class EditServingFormComponent implements OnInit, AfterViewInit {
	form: FormGroup;
	servingCategories = servingCategories;
	servingSizes: ServingSize[] = [];

	isSubmitting = signal<boolean>(false);
	servingGrams = signal<number | undefined>(undefined);
	food = signal<Food | ServingFood | undefined>(undefined);
	serving = signal<Serving | undefined>(undefined);

	get dietaryFlags(): string[] {
		return this.food()?.dietaryFlags || [];
	}

	dialogService = inject(MatDialog);
	overlayRef = inject(FullscreenOverlayRef<EditServingFormComponent>);
	overlayData = inject<{ foodId: string; serving?: Serving }>(FULLSCREEN_OVERLAY_DATA);

	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);
	private formBuilder = inject(FormBuilder);
	private snackService = inject(MatSnackBar);
	private servingsService = inject(ServingsService);
	private foodService = inject(FoodService);

	@ViewChild("amount", { static: false }) amountField: ElementRef<HTMLInputElement> | undefined;
	constructor() {
		this.form = this.formBuilder.group({
			amount: [100, [Validators.required, Validators.min(0.01)]],
			servingSize: [[], Validators.required],
			time: ["", [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
			category: [this.getDefaultCategory(), Validators.required]
		});

		this.form.valueChanges.pipe(startWith(1)).subscribe(() => {
			this.servingGrams.set(this.form!.value.servingSize.gramWeight * this.form!.value.amount);
		});
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			this.amountField?.nativeElement?.select();
		}, 0);
	}

	ngOnInit(): void {
		this.serving.set(this.overlayData.serving);
		if (!this.overlayData.foodId) {
			this.prefillForm(this.overlayData.serving);
			this.food.set(this.overlayData.serving?.food);

			return;
		}

		this.foodService
			.getFood(this.overlayData.foodId)
			.pipe(
				filter((food) => !!food),
				tap((food) => this.prefillForm(this.serving(), food))
			)
			.subscribe((food) => this.food.set({ ...this.overlayData.serving?.food, ...food }));
	}

	prefillForm(serving?: Serving, food?: Food): void {
		if (serving) {
			this.servingSizes = [serving.servingSize];
		}

		if (food) {
			food.servingSizes.forEach((size) => {
				if (!this.servingSizes.some((s) => s.name === size.name)) {
					this.servingSizes.push(size);
				}
			});
		}

		const formattedTime = (serving?.created || new Date()).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false
		});

		this.form.patchValue({
			amount: serving?.servingAmount || 100,
			servingSize: serving?.servingSize || this.servingSizes[0],
			category: serving?.category || this.getDefaultCategory(),
			time: formattedTime
		});

		if (serving?.isEditable === false) {
			this.form.disable();
		}
	}

	onAddServing(): void {
		if (!this.food() || this.form?.invalid || this.isSubmitting()) {
			return;
		}

		this.isSubmitting.set(true);

		const servingData = {
			servingSize: this.form!.value.servingSize,
			servingAmount: this.form!.value.amount,
			category: this.form!.value.category as ServingCategory,
			isCustomized: false
		};

		this.servingsService
			.addServing(this.food()!, servingData)
			.pipe(
				take(1),
				tap(() => {
					this.snackService.open("Serving added successfully!", "Close", { duration: 3000 });
					this.isSubmitting.set(false);
					this.closeOverlay();
				}),
				switchMap(() => this.router.navigate(["/home"]))
			)
			.subscribe();
	}

	onSaveServing(): void {
		const _serving = this.serving();
		if (!_serving || this.form?.invalid || this.isSubmitting()) {
			return;
		}

		this.isSubmitting.set(true);

		const createdTime = this.parseTimeStringToTodayDate(this.form!.value.time);
		const servingData: Partial<Serving> = {
			...this.serving(),
			servingSize: this.form!.value.servingSize,
			servingAmount: this.form!.value.amount,
			category: this.form!.value.category as ServingCategory,
			created: createdTime || new Date()
		};

		this.servingsService
			.updateServing(_serving.id, servingData)
			.pipe(take(1))
			.subscribe(() => {
				this.snackService.open("Serving updated successfully!", "Close", { duration: 3000 });
				this.isSubmitting.set(false);
				this.closeOverlay();
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
				this.servingsService.detele(serving.id).subscribe(() => {
					this.snackService.open("Serving deleted successfully!", "Close", { duration: 3000 });
					this.isSubmitting.set(false);
					this.closeOverlay();
				});
			}
		});
	}

	closeOverlay(): void {
		this.overlayRef?.close(false);
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

	private parseTimeStringToTodayDate(timeString: string): Date | null {
		if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
			return null;
		}

		const parts = timeString.split(":");
		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);

		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			console.error("Invalid hours or minutes value in the time string.");
			return null;
		}

		const resultDate = new Date(); // e.g., 2025-04-10T19:24:34 (using current time from context)
		resultDate.setHours(hours, minutes, 0, 0);

		return resultDate;
	}
}
