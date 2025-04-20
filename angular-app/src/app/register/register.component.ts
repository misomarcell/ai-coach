import { Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router, RouterLink } from "@angular/router";
import { first, from, switchMap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { passwordMatchValidator } from "../services/form.service";

@Component({
	selector: "app-register",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatIconModule,
		MatProgressSpinnerModule,
		RouterLink
	],
	templateUrl: "./register.component.html",
	styleUrl: "./register.component.scss"
})
export class RegisterComponent {
	authService = inject(AuthService);
	router = inject(Router);

	showPassword = signal(false);
	isRegistering = signal(false);

	formGroup = new FormGroup(
		{
			displayName: new FormControl("", [Validators.required, Validators.minLength(3), Validators.maxLength(32)]),
			email: new FormControl("", [Validators.required, Validators.email]),
			password: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(32)]),
			confirmPassword: new FormControl("", [Validators.required])
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
			await this.authService.register(this.formGroup.value.email!, this.formGroup.value.password!, this.formGroup.value.displayName!);
		} finally {
			this.isRegistering.set(false);
		}
	}

	async onProviderLogin(provider: "google" | "github"): Promise<void> {
		if (this.isRegistering()) {
			return;
		}

		this.isRegistering.set(true);

		try {
			this.authService
				.isLoggedIn()
				.pipe(
					first(),
					switchMap((isLoggedIn) =>
						isLoggedIn ? this.router.navigate(["dashboard"]) : from(this.authService.providerLogin(provider))
					)
				)
				.subscribe();
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
				default:
					return `Unknown error`;
			}
		});
	}
}
