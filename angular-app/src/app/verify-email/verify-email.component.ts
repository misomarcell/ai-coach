import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { filter, finalize, from, switchMap, take, tap } from "rxjs";
import { AuthService } from "../services/auth.service";

@Component({
	imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule],
	templateUrl: "./verify-email.component.html",
	styleUrl: "./verify-email.component.scss"
})
export class VerifyEmailComponent {
	private activatedRoute = inject(ActivatedRoute);
	private authService = inject(AuthService);
	private snackService = inject(MatSnackBar);
	private router = inject(Router);

	currentStep = signal<"verify" | "error" | "new-code-sent">("verify");
	oobCode = this.activatedRoute.snapshot.queryParams["oobCode"];
	isLoading = signal(false);

	async onVerifyClick(): Promise<void> {
		if (!this.oobCode) {
			this.router.navigate(["/not-found"]);
			return;
		}

		this.isLoading.set(true);

		try {
			await this.authService.verifyEmail(this.oobCode);
			this.snackService.open("Email verified successfully", "OK");
			await this.router.navigate(["/dashboard"]);
		} catch (error) {
			this.handleVerificationError(error);
		} finally {
			this.isLoading.set(false);
		}
	}

	async onRequestNewCodeClick(): Promise<void> {
		this.isLoading.set(true);

		this.authService
			.getCurrentUser()
			.pipe(
				take(1),
				tap((user) => {
					if (!user) {
						this.snackService.open("Please log in first", "OK", { duration: 5000 });
						this.isLoading.set(false);
						return;
					}
				}),
				filter((user) => !!user),
				switchMap((user) => from(this.authService.requestEmailVerification(user))),
				finalize(() => {
					this.isLoading.set(false);
					this.currentStep.set("new-code-sent");
				})
			)
			.subscribe();
	}

	private handleVerificationError(error: any): void {
		console.error({ error });

		this.currentStep.set("error");

		if (!error.code) {
			this.snackService.open("Couldn't verify your e-mail address", "OK", { duration: 5000 });

			return;
		}

		switch (error.code) {
			case "auth/invalid-action-code":
				this.snackService.open("Invalid verification code. Please try again.", "OK", {
					duration: 5000
				});
				break;
		}
	}
}
