import { Food, servingCategories, ServingCategory } from "@aicoach/shared";
import { AfterViewInit, Component, ElementRef, Inject, OnInit, signal, ViewChild } from "@angular/core";
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
import { MatSnackBar } from "@angular/material/snack-bar";
import { startWith, take } from "rxjs";
import { NutritionLabelComponent } from "../nutrition-label/nutrition-label.component";
import { NutritionListComponent } from "../nutrition-list/nutrition-list.component";
import { ServingsService } from "../services/servings.service";

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
	servingGrams = signal<number | undefined>(undefined);

	get dietaryFlags(): string[] {
		return Array.from(this.food.dietaryFlags || []);
	}

	@ViewChild("amount", { static: false }) amountField: ElementRef<HTMLInputElement> | undefined;
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
			this.servingGrams.set(this.form.value.servingSize.gramWeight * this.form.value.amount);
		});
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			this.amountField?.nativeElement.select();
			this.amountField?.nativeElement.focus();
		}, 0);
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
