import {
	dietaryFlags,
	Food,
	foodCategories,
	FoodStatus,
	NutritionType,
	nutritionTypes,
	NutritionUnit,
	nutritionUnits
} from "@aicoach/shared";
import { COMMA, ENTER, SPACE } from "@angular/cdk/keycodes";
import { TitleCasePipe } from "@angular/common";
import { Component, inject, input, OnInit, signal } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { catchError, EMPTY, finalize, from, map, Observable, switchMap, take } from "rxjs";
import { BarcodeScannerService } from "../services/barcode-scanner.service";
import { FoodService } from "../services/food.service";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../prompt-dialog/prompt-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { OverlayService } from "@aicoach/overlay";
import { EditServingFormComponent } from "../servings/edit-serving-form/edit-serving-form.component";

@Component({
	selector: "app-edit-food-form",
	imports: [
		TitleCasePipe,
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatCardModule,
		MatMenuModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatAutocompleteModule,
		MatChipsModule,
		MatIconModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./edit-food-form.component.html",
	styleUrl: "./edit-food-form.component.scss"
})
export class EditFoodFormComponent implements OnInit {
	private _remainingNutritions: NutritionType[] = [];

	get remainingNutritions(): NutritionType[] {
		return this._remainingNutritions.sort((a, b) => a.localeCompare(b));
	}

	foodForm!: FormGroup;
	separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
	selectedDietaryFlags: string[] = [];
	tags: string[] = [];

	nutritionTypes = nutritionTypes;
	nutritionUnits = nutritionUnits;
	foodCategories = foodCategories;

	defaultNutritions: NutritionType[] = ["Calories", "Total Fat", "Saturated Fat", "Carbohydrates", "Sugar", "Fiber", "Protein", "Salt"];
	dietaryFlags = dietaryFlags;

	private router = inject(Router);
	private foodService = inject(FoodService);
	private scannerService = inject(BarcodeScannerService);
	private dialogService = inject(MatDialog);
	private overlayService = inject(OverlayService);
	private formBuilder = inject(FormBuilder);
	private snackBar = inject(MatSnackBar);

	isLoading = signal(false);
	food = input<Partial<Food>>();

	ngOnInit(): void {
		this.initForm();
		this.updateRemainingNutritions();
		this.prefillAnalyzerResult();
	}

	initForm(): void {
		this.foodForm = this.formBuilder.group({
			name: ["", Validators.required],
			brand: [""],
			barcode: [""],
			category: ["", Validators.required],
			variation: [""],
			nutritions: this.formBuilder.array(this.createDefaultNutritions()),
			servingSizes: this.formBuilder.array([this.createServingSize("g", 1), this.createServingSize("100g", 100)]),
			dietaryFlags: [this.selectedDietaryFlags],
			tags: [this.tags]
		});
	}

	onSubmit(): void {
		const foodId = this.food()?.id;
		if (!this.foodForm.valid || !foodId) {
			return;
		}

		this.isLoading.set(true);
		this.foodService
			.updateFood(foodId, { ...this.foodForm.value }, FoodStatus.Created)
			.pipe(
				take(1),
				catchError(() => {
					this.snackBar.open("Error updating food item", "Close");

					return EMPTY;
				}),
				switchMap(() => this.promptAddServing()),
				switchMap((answer) => (answer ? this.openAddServingOverlay(foodId) : from(this.router.navigate(["/dashboard"])))),
				finalize(() => () => this.isLoading.set(false))
			)
			.subscribe();
	}

	promptAddServing(): Observable<boolean> {
		const dialog = this.dialogService.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(PromptDialogComponent, {
			data: {
				title: "Create serving",
				message: "Do you want to create a serving with this food?",
				buttonLayout: "yes-no"
			}
		});

		return dialog.afterClosed().pipe(
			take(1),
			map((answer) => answer === "yes")
		);
	}

	async openAddServingOverlay(foodId: string): Promise<void> {
		await this.overlayService.open(EditServingFormComponent, {
			data: { foodId }
		});
	}

	createDefaultNutritions(): FormGroup[] {
		return this.defaultNutritions.map((type) => this.createNutrition(type));
	}

	createNutrition(type: NutritionType): FormGroup {
		return this.formBuilder.group({
			type: new FormControl<NutritionType>(type, [Validators.required]),
			unit: new FormControl<NutritionUnit>(type === "Calories" ? "kcal" : "g"),
			amount: new FormControl<number>(0, [Validators.required, Validators.min(0.01)])
		});
	}

	createServingSize(name = "", gramWeight = 1): FormGroup {
		return this.formBuilder.group({
			name: [name, Validators.required],
			gramWeight: [gramWeight, [Validators.required, Validators.min(1)]]
		});
	}

	get nutritionsFormArray(): FormArray {
		return this.foodForm.get("nutritions") as FormArray;
	}

	get servingSizesFormArray(): FormArray {
		return this.foodForm.get("servingSizes") as FormArray;
	}

	updateRemainingNutritions(): void {
		const currentTypes = this.nutritionsFormArray.controls.map((control) => control.get("type")?.value);
		this._remainingNutritions = nutritionTypes.filter((type) => !currentTypes.includes(type));
	}

	isNutritionTypeUnique(type: NutritionType): boolean {
		const currentTypes = this.nutritionsFormArray.controls.map((control) => control.get("type")?.value);
		return !currentTypes.includes(type);
	}

	isNutritionTypeUniqueExcept(type: NutritionType, exceptIndex: number): boolean {
		const currentTypes = this.nutritionsFormArray.controls
			.map((control, index) => ({ value: control.get("type")?.value, index }))
			.filter((item) => item.index !== exceptIndex)
			.map((item) => item.value);

		return !currentTypes.includes(type);
	}

	onNutritionTypeChange(event: any, index: number): void {
		const selectedType = event.value;
		const otherTypes = this.nutritionsFormArray.controls
			.map((control, i) => ({ value: control.get("type")?.value, index: i }))
			.filter((item) => item.index !== index)
			.map((item) => item.value);

		if (otherTypes.includes(selectedType)) {
			const control = this.nutritionsFormArray.at(index).get("type");
			if (control) {
				const previousValue = control.value;
				if (previousValue !== selectedType) {
					setTimeout(() => {
						control.setValue(previousValue);
					});
				}
			}
		}

		this.updateRemainingNutritions();
	}

	addNutrition(type?: NutritionType): void {
		if (type && !this.isNutritionTypeUnique(type)) {
			return;
		}

		this.nutritionsFormArray.push(this.createNutrition(type!));
		this.updateRemainingNutritions();
	}

	removeNutrition(index: number): void {
		this.nutritionsFormArray.removeAt(index);
		this.updateRemainingNutritions();
	}

	addServingSize(): void {
		if (this.servingSizesFormArray.length < 11) {
			this.servingSizesFormArray.push(this.createServingSize());
		}
	}

	removeServing(index: number): void {
		this.servingSizesFormArray.removeAt(index);
	}

	onScanBarcodeClick() {
		this.scannerService.scanBarcode(true).subscribe((result) => {
			if (result) {
				const barcodeControl = this.foodForm.get("barcode");
				if (barcodeControl) {
					barcodeControl.enable();
					barcodeControl.setValue(result.getText());
				}
			}
		});
	}

	addTag(event: MatChipInputEvent): void {
		const value = (event.value || "").trim().toLowerCase();

		if (value) {
			this.tags.push(value);
			this.foodForm.get("tags")?.setValue(this.tags);
		}

		event.chipInput!.clear();
	}

	removeTag(tag: string): void {
		const index = this.tags.indexOf(tag);

		if (index >= 0) {
			this.tags.splice(index, 1);
			this.foodForm.get("tags")?.setValue(this.tags);
		}
	}

	toggleDietaryFlag(flag: string): void {
		const flagControl = this.foodForm.get("dietaryFlags")?.value;
		if (flagControl) {
			const currentFlags = flagControl.value as string[];
			if (this.selectedDietaryFlags.includes(flag)) {
				this.selectedDietaryFlags = currentFlags.filter((f) => f !== flag);
			} else {
				this.selectedDietaryFlags.push(flag);
			}

			this.foodForm.get("dietaryFlags")?.setValue(this.selectedDietaryFlags);
		}
	}

	getErrorMessage(controlName: string): string {
		const control = this.foodForm.get(controlName);

		if (control?.hasError("required")) {
			return "This field is required.";
		} else if (control?.hasError("min")) {
			return "Value must be greater than 0.";
		} else if (control?.hasError("pattern")) {
			return "Invalid format.";
		}
		return "Invalid";
	}

	private prefillAnalyzerResult(): void {
		const prefilledFood = this.food();
		if (!prefilledFood || !this.foodForm) {
			return;
		}

		this.foodForm.patchValue(prefilledFood);
		this.foodForm.get("nutritions")?.value.forEach((nutrition: any, index: number) => {
			const duplicateIndex = this.nutritionsFormArray.controls.findIndex(
				(control, i) => i !== index && control.get("type")?.value === nutrition.type
			);

			if (duplicateIndex !== -1 && nutrition.amount === 0) {
				this.nutritionsFormArray.removeAt(index);
			}
		});
	}
}
