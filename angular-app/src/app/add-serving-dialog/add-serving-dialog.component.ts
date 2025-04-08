import { Food, Nutrition, ServingCategory, ServingSize, servingCategories } from "@aicoach/shared";
import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { startWith, take } from "rxjs";
import { ServingsService } from "../services/servings.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
	selector: "app-add-serving-dialog",
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatDialogModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatExpansionModule,
		MatIconModule,
		MatListModule,
		MatChipsModule
	],
	templateUrl: "./add-serving-dialog.component.html",
	styleUrl: "./add-serving-dialog.component.scss"
})
export class AddServingDialogComponent implements OnInit, AfterViewInit {
	food: Food;
	form: FormGroup;
	servingCategories = servingCategories;
	isSubmitting = false;
	nutritions: Record<string, number> = {};

	get dietaryFlags(): string[] {
		return Array.from(this.food.dietaryFlags || []);
	}

	@ViewChild("amount", { static: false }) amount: ElementRef<HTMLInputElement> | undefined;
	constructor(
		private formBuilder: FormBuilder,
		private snackService: MatSnackBar,
		private servingsService: ServingsService,
		private dialogRef: MatDialogRef<AddServingDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { food: Food }
	) {
		this.food = data.food;

		const now = new Date();
		const hours = now.getHours().toString().padStart(2, "0");
		const minutes = now.getMinutes().toString().padStart(2, "0");
		const currentTime = `${hours}:${minutes}`;

		const defaultServingSize =
			this.food.servingSizes && this.food.servingSizes.length > 0 ? this.food.servingSizes[0] : { name: "100g", gramWeight: 100 };

		this.form = this.formBuilder.group({
			amount: [100, [Validators.required, Validators.min(0.01)]],
			servingSize: [defaultServingSize, Validators.required],
			time: [currentTime, [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
			category: [this.getDefaultCategory(), Validators.required]
		});
	}

	ngOnInit(): void {
		this.form.valueChanges.pipe(startWith(1)).subscribe(() => {
			this.calculateNutritionAmounts();
		});
	}

	ngAfterViewInit(): void {
		this.amount?.nativeElement.select();
		this.amount?.nativeElement.focus();
	}

	calculateNutritionAmounts(): void {
		const amount = this.form.get("amount")?.value || 0;
		this.food.nutritions.forEach((nutrition) => {
			this.nutritions[nutrition.type] = this.getNutritionAmount(nutrition) * amount;
		});
	}

	getNutritionAmount(nutrition: Nutrition): number {
		const servingSize = this.form.get("servingSize")?.value as ServingSize;
		if (!servingSize) return 0;

		const multiplier = servingSize.gramWeight / 100;
		return parseFloat((nutrition.amount * multiplier).toFixed(2));
	}

	getSortedNutritionList(): Nutrition[] {
		const sorted = this.food.nutritions.sort((a, b) => this.getAbsoluteAmount(b) - this.getAbsoluteAmount(a));

		return sorted.filter((n) => n.type !== "Calories");
	}

	onAddServing(): void {
		if (this.form.invalid || this.isSubmitting) {
			return;
		}

		this.isSubmitting = true;

		const servingData = {
			servingSize: this.form.value.servingSize,
			category: this.form.value.category as ServingCategory,
			isCustomized: false
		};

		this.servingsService
			.addServing(this.food, servingData)
			.pipe(take(1))
			.subscribe(() => {
				this.snackService.open("Serving added successfully!", "Close", { duration: 3000 });
				this.dialogRef.close();
			});
	}

	onClose(): void {
		this.dialogRef.close(false);
	}

	private getAbsoluteAmount(nutrition: Nutrition): number {
		const { amount, unit } = nutrition;

		switch (unit) {
			case "g":
				return amount * 1_000_000; // 1g = 1,000,000 µg
			case "mg":
				return amount * 1_000; // 1mg = 1,000 µg
			case "µg":
				return amount; // Already in µg
			case "IU":
			case "ml":
			case "%":
				return amount;
			default:
				return amount;
		}
	}

	private getDefaultCategory(): ServingCategory {
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
}
