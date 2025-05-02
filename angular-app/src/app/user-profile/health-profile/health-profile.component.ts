import { ActivityLevel, calculateAge, calculateBmi, calculateMaintenanceCalories, HealthProfile } from "@aicoach/shared";
import { CustomDateAdapter } from "@aicoach/utils/date-adapter.util";
import { COMMA, ENTER, TAB } from "@angular/cdk/keycodes";
import { Platform } from "@angular/cdk/platform";
import { DecimalPipe } from "@angular/common";
import { Component, inject, Signal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, EMPTY, from, map, of, startWith, switchMap, take, tap } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { PromptDialogComponent, PromptDialogData, PromptDialogResult } from "../../prompt-dialog/prompt-dialog.component";
import { HealthProfileService } from "../../services/health-profile.service";
import { DIET_GOALS, DIETARY_RESTRICTIONS, HEALTH_CONDITIONS } from "./health-options";

@Component({
	selector: "app-health-profile",
	imports: [
		DecimalPipe,
		PageTitleComponent,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatDividerModule,
		MatChipsModule,
		MatIconModule,
		MatSelectModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatAutocompleteModule
	],
	providers: [
		{ provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
		{ provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
	],
	templateUrl: "./health-profile.component.html",
	styleUrl: "./health-profile.component.scss"
})
export class HealthProfileComponent {
	formGroup: FormGroup;
	isLoading = signal(false);
	isSubmitting = signal(false);

	private router = inject(Router);
	private actiavtedRoute = inject(ActivatedRoute);
	private formBuilder = inject(FormBuilder);
	private healthProfileService = inject(HealthProfileService);
	private snackBar = inject(MatSnackBar);
	private dialogService = inject(MatDialog);
	readonly separatorKeysCodes = [ENTER, COMMA, TAB] as const;

	dietGoals = signal<string[]>([]);
	dietRestrictions = signal<string[]>([]);
	healthConditions = signal<string[]>([]);

	dietGoalCtrl = new FormControl("");
	dietRestrictionCtrl = new FormControl("");
	healthConditionCtrl = new FormControl("");

	filteredDietGoals: Signal<string[]>;
	filteredDietRestrictions: Signal<string[]>;
	filteredHealthConditions: Signal<string[]>;

	predefinedDietGoals = DIET_GOALS;
	predefinedDietRestrictions = DIETARY_RESTRICTIONS;
	predefinedHealthConditions = HEALTH_CONDITIONS;

	bmi = signal<number | undefined>(undefined);
	age = signal<number | undefined>(undefined);
	maintanenceCalories = signal<number | undefined>(undefined);

	activityLevels: { value: ActivityLevel; label: string }[] = [
		{ value: "sedentary", label: "👨‍💻 Sedentary (little or no exercise)" },
		{ value: "light", label: "🚶 Light (exercise 1-3 times/week)" },
		{ value: "moderate", label: "🏃 Moderate (exercise 3-5 times/week)" },
		{ value: "active", label: "🤸 Active (daily exercise or intense exercise 3-4 times/week)" },
		{ value: "very active", label: "🔥 Very Active (intense exercise 6-7 times/week)" }
	];

	constructor() {
		this.formGroup = this.formBuilder.group({
			gender: [null, Validators.required],
			heightCm: [null, [Validators.required, Validators.min(140), Validators.max(250)]],
			weightKg: [null, [Validators.required, Validators.min(30), Validators.max(300)]],
			birthDate: [null, Validators.required],
			activityLevel: [null, Validators.required],
			dietGoals: [[], [Validators.required, Validators.minLength(1), Validators.maxLength(5)]],
			dietaryRestrictions: [[]],
			healthConditions: [[]]
		});

		const routeData = this.actiavtedRoute.snapshot.data["healthProfile"];
		if (routeData) {
			this.prefillForm(routeData);
		}

		this.filteredDietGoals = toSignal(
			this.dietGoalCtrl.valueChanges.pipe(
				startWith(""),
				map((value) => this.filterSelection(value || "", this.predefinedDietGoals))
			),
			{ initialValue: [] }
		);

		this.filteredDietRestrictions = toSignal(
			this.dietRestrictionCtrl.valueChanges.pipe(
				startWith(""),
				map((value) => this.filterSelection(value || "", this.predefinedDietRestrictions))
			),
			{ initialValue: [] }
		);

		this.filteredHealthConditions = toSignal(
			this.healthConditionCtrl.valueChanges.pipe(
				startWith(""),
				map((value) => this.filterSelection(value || "", this.predefinedHealthConditions))
			),
			{ initialValue: [] }
		);

		this.formGroup.valueChanges.subscribe((value) => this.setCalculatedData(value));
	}

	prefillForm(healthProfile?: HealthProfile): void {
		if (!healthProfile) {
			return;
		}

		this.formGroup.patchValue(healthProfile);
		this.dietGoals.update(() => healthProfile.dietGoals || []);
		this.dietRestrictions.update(() => healthProfile.dietaryRestrictions || []);
		this.healthConditions.update(() => healthProfile.healthConditions || []);

		this.setCalculatedData(healthProfile);
	}

	onSubmit(): void {
		if (this.formGroup.invalid) {
			return;
		}

		this.isSubmitting.set(true);
		this.healthProfileService
			.setHealthProfile(this.formGroup.value)
			.pipe(
				take(1),
				switchMap(() => {
					this.snackBar.open("Your profile is updated succesfully", "Close");

					return from(this.router.navigate(["/dashboard"]));
				}),
				catchError((error) => {
					this.snackBar.open(`Failed to submit analysis request: ${error.message}`, "Close", {
						duration: 5000
					});

					return of(EMPTY);
				}),
				tap(() => this.isSubmitting.set(false))
			)
			.subscribe();
	}

	addItem(event: MatChipInputEvent, controlName: string): void {
		const value = (event.value || "").trim();

		if (!value) {
			return;
		}

		switch (controlName) {
			case "dietGoals":
				this.dietGoals.update((prev) => [...prev, value]);
				this.formGroup.controls["dietGoals"].setValue(this.dietRestrictions());

				this.dietGoalCtrl.setValue("");
				break;
			case "dietaryRestrictions":
				this.dietRestrictions.update((prev) => [...prev, value]);
				this.formGroup.controls["dietaryRestrictions"].setValue(this.dietRestrictions());

				this.dietRestrictionCtrl.setValue("");
				break;
			case "healthConditions":
				this.healthConditions.update((prev) => [...prev, value]);
				this.formGroup.controls["healthConditions"].setValue(this.healthConditions());
				this.healthConditionCtrl.setValue("");
				break;
			default:
				break;
		}

		event.chipInput?.clear();
	}

	selectedItem(event: MatAutocompleteSelectedEvent, controlName: string): void {
		const value = event.option.viewValue;

		event.option.deselect();
		switch (controlName) {
			case "dietGoals":
				if (!this.dietGoals().includes(value)) {
					this.dietGoals.update((prev) => [...prev, value]);
					this.formGroup.controls["dietGoals"].setValue(this.healthConditions());
				}

				(document.querySelector("[name='dietGoalsInput']") as HTMLInputElement).value = "";
				this.dietGoalCtrl.setValue("");

				break;
			case "dietaryRestrictions":
				if (!this.dietRestrictions().includes(value)) {
					this.dietRestrictions.update((prev) => [...prev, value]);
					this.formGroup.controls["dietaryRestrictions"].setValue(this.healthConditions());
				}

				(document.querySelector("[name='dietaryRestrictionsInput']") as HTMLInputElement).value = "";
				this.dietRestrictionCtrl.setValue("");

				this.dietRestrictionCtrl.setValue("");
				break;
			case "healthConditions":
				if (!this.healthConditions().includes(value)) {
					this.healthConditions.update((prev) => [...prev, value]);
					this.formGroup.controls["healthConditions"].setValue(this.healthConditions());
				}

				(document.querySelector("[name='healthConditionsInput']") as HTMLInputElement).value = "";
				this.healthConditionCtrl.setValue("");

				break;
			default:
				break;
		}
	}

	removeItem(index: number, controlName: string): void {
		switch (controlName) {
			case "dietGoals":
				this.dietGoals.update((prev) => prev.filter((_, i) => i !== index));
				this.formGroup.controls["dietGoals"].setValue(this.dietRestrictions());
				break;
			case "dietaryRestrictions":
				this.dietRestrictions.update((prev) => prev.filter((_, i) => i !== index));
				this.formGroup.controls["dietaryRestrictions"].setValue(this.dietRestrictions());
				break;
			case "healthConditions":
				this.healthConditions.update((prev) => prev.filter((_, i) => i !== index));
				this.formGroup.controls["healthConditions"].setValue(this.dietRestrictions());
				break;
			default:
				break;
		}
	}

	setCalculatedData(profile: HealthProfile): void {
		this.bmi.set(calculateBmi(profile.weightKg, profile.heightCm));
		const age = calculateAge(profile.birthDate);
		if (!age || isNaN(age)) {
			return;
		}

		this.age.set(age);
		this.maintanenceCalories.set(
			calculateMaintenanceCalories({
				age,
				activityLevel: profile.activityLevel,
				gender: profile.gender,
				heightCm: profile.heightCm,
				weightKg: profile.weightKg
			})
		);
	}

	onBackClick(): void {
		this.router.navigate(["/profile"]);
	}

	getErrorsFor(controlName: string): string {
		const control = this.formGroup.get(controlName);
		if (!control) {
			return "";
		}

		if (control.hasError("required")) {
			return "This field is required";
		}

		if (control.hasError("min")) {
			return `Minimum value is ${control.getError("min").min}`;
		}

		if (control.hasError("max")) {
			return `Maximum value is ${control.getError("max").max}`;
		}

		if (control.hasError("minlength")) {
			return `Minimum length is ${control.getError("minlength").requiredLength}`;
		}

		if (control.hasError("maxlength")) {
			return `Maximum length is ${control.getError("maxlength").requiredLength}`;
		}

		return "Invalid value";
	}

	async showCalculationHelp(): Promise<void> {
		const promptDialogComponent = await import("../../prompt-dialog/prompt-dialog.component").then((m) => m.PromptDialogComponent);
		this.dialogService.open<PromptDialogComponent, PromptDialogData, PromptDialogResult>(promptDialogComponent, {
			data: {
				title: "Calculated Data",
				message: `To calculate your maintenance calories (BMR), we use the Mifflin-St Jeor equation, which is a widely accepted formula for estimating Basal Metabolic Rate.
				\nBMR is the number of calories your body needs to maintain basic physiological functions at rest.
				To estimate your Total Daily Energy Expenditure (TDEE), we multiply your BMR by an activity factor that corresponds to your lifestyle. This gives us the number of calories you need to maintain your current weight.
				\nBMI is calculated using the formula: weight[kg] / (height[m] * height[m]).`,
				buttonLayout: "ok"
			}
		});
	}

	private filterSelection(value: string, options: string[]): string[] {
		const filterValue = value.toLowerCase();
		const filtered = options.filter((option) => option.toLowerCase().includes(filterValue));

		if (filtered.length === 0 && value) {
			return [value];
		}

		return filtered;
	}
}
