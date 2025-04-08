import { AnalysisCommunicationChannel, AnalysisCommunicationFrequency, AnalysisPreferences } from "@aicoach/shared";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { CommonModule, isPlatformServer } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, OnInit, Output, PLATFORM_ID } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { catchError, EMPTY, of, take, tap } from "rxjs";

import { AnalysisService } from "../services/analysis.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
	selector: "app-analysis-preferences-form",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatChipsModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatSelectModule,
		MatSnackBarModule
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./analysis-preferences-form.component.html",
	styleUrl: "./analysis-preferences-form.component.scss"
})
export class AnalysisPreferencesFormComponent implements OnInit {
	dialogData: AnalysisPreferences | null = null;
	dialogRef: MatDialogRef<AnalysisPreferencesFormComponent>;

	formGroup: FormGroup;
	isBrowser = !isPlatformServer(inject(PLATFORM_ID));
	isSubmitting = false;
	isLoading = true;

	get goalsArray(): FormArray {
		return this.formGroup.get("goals") as FormArray;
	}

	get dietaryRestrictionsArray(): FormArray {
		return this.formGroup.get("dietaryRestrictions") as FormArray;
	}

	get healthConditionsArray(): FormArray {
		return this.formGroup.get("healthConditions") as FormArray;
	}

	readonly separatorKeysCodes = [ENTER, COMMA] as const;
	readonly communicationFrequencies = Object.values(AnalysisCommunicationFrequency);
	readonly communicationChannels = Object.values(AnalysisCommunicationChannel);

	@Output() requestSent = new EventEmitter<void>();

	constructor(
		private formBuilder: FormBuilder,
		private analysisRequestService: AnalysisService,
		private changeDetector: ChangeDetectorRef,
		private snackBar: MatSnackBar
	) {
		this.dialogRef = inject<MatDialogRef<AnalysisPreferencesFormComponent>>(MatDialogRef);
		this.dialogData = inject<AnalysisPreferences>(MAT_DIALOG_DATA);

		this.formGroup = this.formBuilder.group({
			description: ["", [Validators.required, Validators.maxLength(500)]],
			goals: this.formBuilder.array([], Validators.required),
			dietaryRestrictions: this.formBuilder.array([]),
			healthConditions: this.formBuilder.array([]),
			communicationFrequency: [AnalysisCommunicationFrequency.Weekly],
			communicationChannel: [AnalysisCommunicationChannel.Telegram]
		});
	}

	ngOnInit(): void {
		if (this.dialogData) {
			this.populateFormFromRequest(this.dialogData);
		}

		this.isLoading = false;
		if (this.isBrowser) {
			this.changeDetector.markForCheck();
		}
	}

	addItem(event: MatChipInputEvent, controlName: string): void {
		const input = event.input;
		const value = event.value.trim();
		const formArray = this.formGroup.get(controlName) as FormArray;

		if (value) {
			formArray.push(new FormControl(value));
		}

		if (input) {
			input.value = "";
		}
	}

	removeItem(index: number, controlName: string): void {
		const formArray = this.formGroup.get(controlName) as FormArray;
		if (index >= 0) {
			formArray.removeAt(index);
		}
	}

	onSubmit(): void {
		if (this.formGroup.invalid) {
			return;
		}

		this.isSubmitting = true;
		this.analysisRequestService
			.setAnalysisPreferences$(this.formGroup.value)
			.pipe(
				take(1),
				tap(() => {
					this.dialogRef.close();
					this.snackBar.open("Your profile is updated succesfully", "Close", {
						duration: 3000
					});

					this.requestSent.emit();
				}),
				catchError((error) => {
					this.snackBar.open(`Failed to submit analysis request: ${error.message}`, "Close", {
						duration: 5000
					});

					return of(EMPTY);
				}),
				tap(() => (this.isSubmitting = false))
			)
			.subscribe();
	}

	onCloseClick(): void {
		this.dialogRef.close();
	}
	private populateFormFromRequest(preferences: AnalysisPreferences): void {
		if (preferences.description) {
			this.formGroup.get("description")?.setValue(preferences.description);
		}

		if (preferences.goals && preferences.goals.length > 0) {
			const goalsArray = this.formGroup.get("goals") as FormArray;
			preferences.goals.forEach((goal) => {
				goalsArray.push(new FormControl(goal));
			});
		}

		if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
			const restrictionsArray = this.formGroup.get("dietaryRestrictions") as FormArray;
			preferences.dietaryRestrictions.forEach((restriction) => {
				restrictionsArray.push(new FormControl(restriction));
			});
		}

		if (preferences.healthConditions && preferences.healthConditions.length > 0) {
			const conditionsArray = this.formGroup.get("healthConditions") as FormArray;
			preferences.healthConditions.forEach((condition) => {
				conditionsArray.push(new FormControl(condition));
			});
		}

		if (preferences.communicationFrequency) {
			this.formGroup.get("communicationFrequency")?.setValue(preferences.communicationFrequency);
		}

		if (preferences.communicationChannel) {
			this.formGroup.get("communicationChannel")?.setValue(preferences.communicationChannel);
		}
	}
}
