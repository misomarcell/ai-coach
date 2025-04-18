import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { AuthService } from "../services/auth.service";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { from, tap } from "rxjs";
import { passwordMatchValidator } from "../services/form.service";

@Component({
	selector: "app-forgot-password",
	imports: [RouterLink, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
	templateUrl: "./forgot-password.component.html",
	styleUrl: "./forgot-password.component.scss"
})
export class ForgotPasswordComponent implements OnInit {
	private authService = inject(AuthService);
	private activatedRoute = inject(ActivatedRoute);
	private oobCode = this.activatedRoute.snapshot.queryParamMap.get("oobCode") ?? undefined;

	currentStep = signal<"email" | "email-sent" | "new-password" | "done" | "error">("email");
	errorMessage: string | undefined = undefined;

	showPassword = signal<boolean>(false);
	passwordResetEmail = signal<string | undefined>(undefined);

	emailControl = new FormControl<string>("", [Validators.required, Validators.email]);
	newPasswordFormGroup = new FormGroup(
		{
			password: new FormControl<string>("", [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
			confirmPassword: new FormControl<string>("", [Validators.required, Validators.minLength(6), Validators.maxLength(20)])
		},
		{ validators: passwordMatchValidator("password", "confirmPassword") }
	);

	constructor() {
		const routeStep = this.activatedRoute.snapshot.queryParamMap.get("step");
		if (routeStep === "new-password") {
			this.currentStep.set("new-password");
		}
	}

	ngOnInit(): void {
		if (!this.oobCode) {
			return;
		}

		from(this.authService.getResetPasswordEmail(this.oobCode))
			.pipe(
				tap(({ email, error }) => {
					console.log("email", email, "error", error);
					if (email) {
						this.passwordResetEmail.set(email);
					} else if (error) {
						this.currentStep.set("error");
						this.errorMessage = this.getErrorMessage(error);
					}
				})
			)
			.subscribe();
	}

	async onResetClick() {
		this.emailControl.markAllAsTouched();
		if (!this.emailControl.valid) {
			return;
		}

		await this.authService.resetPassword(this.emailControl.value!);
		this.passwordResetEmail.set(this.emailControl.value!);
		this.currentStep.set("email-sent");
	}

	async onChangePasswordClick() {
		this.newPasswordFormGroup.markAllAsTouched();
		if (!this.newPasswordFormGroup.valid || !this.oobCode) {
			return;
		}

		const password = this.newPasswordFormGroup.get("password")?.value;
		await this.authService.updatePassword(this.oobCode, password!);
		this.currentStep.set("done");
	}

	private getErrorMessage(error: any): string {
		switch (error.code) {
			case "auth/invalid-action-code":
				return "The action code is invalid.";
			default:
				return "An unknown error occurred.";
		}
	}
}
