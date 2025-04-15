import { Component, inject, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router, RouterModule } from "@angular/router";
import { first, from, switchMap } from "rxjs";
import { AuthService } from "../services/auth.service";

@Component({
	selector: "app-login",
	standalone: true,
	imports: [
		RouterModule,
		ReactiveFormsModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatIconModule,
		MatProgressSpinnerModule
	],
	templateUrl: "./login.component.html",
	styleUrl: "./login.component.scss"
})
export class LoginComponent {
	authService = inject(AuthService);
	router = inject(Router);

	showPassword = signal(false);
	isLoggingIn = signal(false);
	formGroup = new FormGroup({
		email: new FormControl("", [Validators.required, Validators.email]),
		password: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(32)])
	});

	async onNormalLogin(): Promise<void> {
		if (this.formGroup.invalid || this.isLoggingIn()) {
			return;
		}

		this.isLoggingIn.set(true);

		try {
			await this.authService.normalLogin(this.formGroup.value.email!, this.formGroup.value.password!);
		} finally {
			this.isLoggingIn.set(false);
		}
	}

	async onProviderLogin(provider: "google" | "github"): Promise<void> {
		if (this.isLoggingIn()) {
			return;
		}

		this.isLoggingIn.set(true);

		try {
			this.authService
				.isLoggedIn$()
				.pipe(
					first(),
					switchMap((isLoggedIn) =>
						isLoggedIn ? this.router.navigate(["home"]) : from(this.authService.providerLogin(provider))
					)
				)
				.subscribe();
		} finally {
			this.isLoggingIn.set(false);
		}
	}

	getErrorMessagesFor(controlName: string): string[] {
		const control = this.formGroup.get(controlName);
		if (!control) {
			return [];
		}

		const errors = control.errors;
		if (!errors) {
			return [];
		}

		return Object.keys(errors).map((key) => {
			switch (key) {
				case "required":
					return `${controlName} is required`;
				case "email":
					return `Invalid email address`;
				case "minlength":
					return `Minimum length is ${errors["minlength"].requiredLength}`;
				case "maxlength":
					return `Maximum length is ${errors["maxlength"].requiredLength}`;
				default:
					return `Unknown error`;
			}
		});
	}
}
