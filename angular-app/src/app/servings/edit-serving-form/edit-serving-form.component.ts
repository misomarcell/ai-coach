import { Food, Serving, servingCategories, ServingCategory, ServingSize } from "@aicoach/shared";
import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { filter, startWith, take, tap } from "rxjs";
import { NutritionLabelComponent } from "../../nutrition-label/nutrition-label.component";
import { NutritionListComponent } from "../../nutrition-list/nutrition-list.component";
import { FullscreenOverlayRef } from "../../overlay/overlay-ref";
import { FULLSCREEN_OVERLAY_DATA } from "../../overlay/overlay.token";
import { FoodService } from "../../services/food.service";
import { ServingsService } from "../servings.service";
import { ActivatedRoute } from "@angular/router";
import { animate, group, query, style, transition, trigger } from "@angular/animations";

const slideInOut = trigger("slideInOut", [
	transition(":enter", [
		style({ transform: "translateX(-100%)", opacity: 0 }),
		group([
			query(":self", animate("1ms")),
			animate("250ms cubic-bezier(0.0, 0.0, 0.2, 1)", style({ transform: "translateY(0)", opacity: 1 }))
		])
	]),
	transition(":leave", [animate("200ms cubic-bezier(0.4, 0.0, 1, 1)", style({ transform: "translateX(100%)", opacity: 0 }))])
]);

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
	servingGrams = signal<number>(0);
	food = signal<Food | undefined>(undefined);
	serving = signal<Serving | undefined>(undefined);

	get dietaryFlags(): string[] {
		return this.food()?.dietaryFlags || [];
	}

	overlayRef = inject(FullscreenOverlayRef<EditServingFormComponent>);
	overlayData = inject<{ foodId: string; serving?: Serving }>(FULLSCREEN_OVERLAY_DATA);

	private activatedRoute = inject(ActivatedRoute);
	private formBuilder = inject(FormBuilder);
	private snackService = inject(MatSnackBar);
	private servingsService = inject(ServingsService);
	private foodService = inject(FoodService);

	@ViewChild("amount", { static: false }) amountField: ElementRef<HTMLInputElement> | undefined;
	constructor() {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, "0");
		const minutes = now.getMinutes().toString().padStart(2, "0");
		const currentTime = `${hours}:${minutes}`;

		this.form = this.formBuilder.group({
			amount: [100, [Validators.required, Validators.min(0.01)]],
			servingSize: [[], Validators.required],
			time: [currentTime, [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
			category: [this.getDefaultCategory(), Validators.required]
		});

		this.form.valueChanges.pipe(startWith(1)).subscribe(() => {
			this.servingGrams.set(this.form!.value.servingSize.gramWeight * this.form!.value.amount);
		});
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			// this.amountField?.nativeElement?.focus();
			this.amountField?.nativeElement?.select();
		}, 0);
	}

	ngOnInit(): void {
		if (!this.overlayData.foodId) {
			this.snackService.open("No food data available", "Close", { duration: 3000 });

			return;
		}

		this.serving.set(this.overlayData.serving);
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

		this.form.patchValue({
			amount: serving?.servingAmount || 100,
			servingSize: serving?.servingSize || this.servingSizes[0],
			category: serving?.category || this.getDefaultCategory()
		});
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
			.pipe(take(1))
			.subscribe(() => {
				this.snackService.open("Serving added successfully!", "Close", { duration: 3000 });
				this.isSubmitting.set(false);
				this.closeOverlay();
			});
	}

	onSaveServing(): void {
		const _serving = this.serving();
		console.log("Serving", _serving);

		if (!_serving || this.form?.invalid || this.isSubmitting()) {
			return;
		}

		this.isSubmitting.set(true);

		const servingData: Partial<Serving> = {
			...this.serving(),
			servingSize: this.form!.value.servingSize,
			servingAmount: this.form!.value.amount,
			category: this.form!.value.category as ServingCategory
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

	closeOverlay(): void {
		this.overlayRef?.close(false);
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
}
