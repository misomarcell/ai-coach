import { Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterLink } from "@angular/router";
import { ExternalAuthProvider } from "../services/auth.service";
import { passwordMatchValidator } from "../services/form.service";
import { RegistrationService } from "./registration.service";
import { MatCheckboxModule } from "@angular/material/checkbox";

@Component({
	selector: "app-register",
	standalone: true,
	imports: [
		RouterLink,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatIconModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		RouterLink
	],
	templateUrl: "./registration.component.html",
	styleUrl: "./registration.component.scss"
})
export class RegistrationComponent {
	private registrationService = inject(RegistrationService);
	private snackBar = inject(MatSnackBar);

	showPassword = signal(false);
	isRegistering = signal(false);

	formGroup = new FormGroup(
		{
			displayName: new FormControl("", [Validators.required, Validators.minLength(3), Validators.maxLength(32)]),
			email: new FormControl("", [Validators.required, Validators.email]),
			password: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(32)]),
			confirmPassword: new FormControl("", [Validators.required]),
			termsAccepted: new FormControl(false, [Validators.requiredTrue])
		},
		{
			validators: passwordMatchValidator("password", "confirmPassword")
		}
	);

	async onRegister(): Promise<void> {
		if (this.formGroup.invalid) {
			return;
		}

		this.isRegistering.set(true);

		try {
			await this.registrationService.register(
				this.formGroup.value.email!,
				this.formGroup.value.password!,
				this.formGroup.value.displayName!
			);
		} catch (error) {
			this.handleRegistrationError(error);
		} finally {
			this.isRegistering.set(false);
		}
	}

	async onProviderLogin(provider: ExternalAuthProvider): Promise<void> {
		if (this.isRegistering()) {
			return;
		}

		try {
			this.isRegistering.set(true);
			await this.registrationService.registerWithProvider(provider);
		} finally {
			this.isRegistering.set(false);
		}
	}

	getErrorMessagesFor(controlName: string, label: string): string[] {
		const control = this.formGroup.get(controlName);
		if (!control) {
			return [];
		}

		const errors =
			controlName === "confirmPassword" && this.formGroup.hasError("passwordMismatch")
				? { ...control.errors, passwordMismatch: true }
				: control.errors;

		if (!errors) {
			return [];
		}

		return Object.keys(errors).map((key) => {
			switch (key) {
				case "required":
					return `${label} is required`;
				case "email":
					return `Invalid e-mail address`;
				case "minlength":
					return `Minimum length is ${errors["minlength"].requiredLength}`;
				case "maxlength":
					return `Maximum length is ${errors["maxlength"].requiredLength}`;
				case "passwordMismatch":
					return `Passwords do not match`;
				case "wrongPassword":
					return `This password cannot be used.`;
				case "invalidEmail":
					return `This e-mail cannot be used.`;
				case "emailAlreadyInUse":
					return `This e-mail is already in use.`;
				case "invalidDisplayName":
					return `This name cannot be used.`;
				default:
					return `Unknown error`;
			}
		});
	}

	private handleRegistrationError(error: any): any {
		let message = "Registration failed. Please try again.";
		switch (error.code) {
			case "auth/email-already-in-use":
				this.formGroup.get("email")?.setErrors({ emailAlreadyInUse: true });
				message = "This e-mail is already in use.";
				break;
			case "auth/invalid-email":
				this.formGroup.get("email")?.setErrors({ invalidEmail: true });
				message = "Invalid email address. Please check your email address.";
				break;
			case "auth/invalid-display-name":
				this.formGroup.get("displayName")?.setErrors({ invalidDisplayName: true });
				message = "Invalid display name. Please check your display name.";
				break;
			case "auth/wrong-password":
				this.formGroup.get("password")?.setErrors({ wrongPassword: true });
				message = "Invalid password. Please check your password.";
				break;
			case "auth/operation-not-allowed":
				message = "Account creation is disabled. Please contact support.";
				break;
			case "auth/account-exists-with-different-credential":
				message = "An account already exists with the same email address.";
				break;
			default:
				console.error("Auth error:", error);
				break;
		}

		this.snackBar.open(message, "Close", {
			panelClass: ["snackbar-error"]
		});
	}
}
