import { AiModel, aiModels, SettingsProfile } from "@aicoach/shared";
import { Component, inject, signal } from "@angular/core";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, EMPTY, filter, finalize, from, of, switchMap, take } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { SettingsProfileService } from "../../services/settings-profile.service";
import { DatePipe, NgStyle } from "@angular/common";
import { MatRippleModule } from "@angular/material/core";

@Component({
	imports: [
		DatePipe,
		NgStyle,
		PageTitleComponent,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatRippleModule,
		MatInputModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatDividerModule,
		MatIconModule,
		MatCardModule,
		MatSelectModule,
		MatCheckboxModule
	],
	templateUrl: "./settings.component.html",
	styleUrl: "./settings.component.scss"
})
export class SettingsComponent {
	formGroup: FormGroup;
	lastUpdated = signal<Date | undefined>(undefined);
	isLoading = signal(false);
	isSubmitting = signal(false);

	aiModels = aiModels;

	private router = inject(Router);
	private formBuilder = inject(FormBuilder);
	private settingsProfileService = inject(SettingsProfileService);
	private authService = inject(AuthService);
	private snackBar = inject(MatSnackBar);
	private actiavtedRoute = inject(ActivatedRoute);

	constructor() {
		this.formGroup = this.formBuilder.group({
			displayName: ["", [Validators.required]],
			email: ["", [Validators.required, Validators.email]],
			photoURL: [""],
			receiveNewsAndUpdates: [true],
			aiModel: ["gpt-4o" as AiModel, [Validators.required]]
		});

		this.isLoading.set(true);

		const routeData = this.actiavtedRoute.snapshot.data["settingsProfile"];

		if (routeData) {
			this.prefillForm(routeData);
			this.lastUpdated.set(routeData.lastUpdated);
			this.isLoading.set(false);
		} else {
			this.authService
				.getCurrentUser()
				.pipe(
					filter((user) => !!user),
					take(1)
				)
				.subscribe((user) => {
					this.formGroup.patchValue({
						displayName: user.displayName || "",
						email: user.email || "",
						photoURL: user.photoURL || ""
					});
				});

			this.isLoading.set(false);
		}
	}

	prefillForm(settingsProfile: SettingsProfile): void {
		this.formGroup.patchValue({
			displayName: settingsProfile.displayName || "",
			email: settingsProfile.email || "",
			photoURL: settingsProfile.photoURL || "",
			receiveNewsAndUpdates: settingsProfile.receiveNewsAndUpdates || false,
			aiModel: settingsProfile.aiModel || "gpt-4o"
		});
	}

	onSubmit(): void {
		if (this.formGroup.invalid) {
			return;
		}

		this.isSubmitting.set(true);

		const settingsData: SettingsProfile = {
			...this.formGroup.value,
			lastUpdated: new Date()
		};

		this.settingsProfileService
			.setSettingsProfile(settingsData)
			.pipe(
				take(1),
				switchMap(() => {
					this.snackBar.open("Your settings have been updated successfully", "Close");

					return from(this.router.navigate(["/profile"]));
				}),
				catchError((error) => {
					console.error("Error updating settings", error);
					this.snackBar.open(`Failed to update settings. Please try again.`, "Close");

					return of(EMPTY);
				}),
				finalize(() => this.isSubmitting.set(false))
			)
			.subscribe();
	}

	getErrorsFor(controlName: string): string {
		const control = this.formGroup.get(controlName);
		if (!control) {
			return "";
		}

		if (control.hasError("required")) {
			return "This field is required";
		}

		if (control.hasError("email")) {
			return "Please enter a valid email address";
		}

		return "Invalid value";
	}
}
