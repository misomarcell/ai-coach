import { Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterModule } from "@angular/router";
import { catchError, EMPTY, filter, from, map, switchMap } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { PromptService } from "../../services/prompt.service";
import { PwaService } from "../../services/pwa.service";
import { UserProfileService } from "../../services/user-profile.service";

@Component({
	selector: "app-profile-menu",
	imports: [RouterModule, PageTitleComponent, MatIconModule, MatRippleModule],
	templateUrl: "./profile-menu.component.html",
	styleUrl: "./profile-menu.component.scss"
})
export class ProfileMenuComponent {
	private authService = inject(AuthService);
	private profileService = inject(UserProfileService);
	private promptService = inject(PromptService);
	private snackBar = inject(MatSnackBar);
	private pwaService = inject(PwaService);

	isInstallable = signal(false);
	isEmailVerified = toSignal(
		this.authService.getCurrentUser().pipe(
			filter((user) => !!user),
			map((user) => user?.emailVerified)
		),
		{ initialValue: true }
	);
	isAdmin = toSignal(this.authService.isAdmin(), { initialValue: false });
	name = toSignal(this.profileService.getUserProfile().pipe(map((u) => u?.displayName || "")), { initialValue: "" });

	constructor() {
		this.isInstallable.set(this.pwaService.isReadyToInstall());
	}

	onVerifyCLick() {
		const promptResult = this.promptService.prompt("Verify Email", "Do you need a new verification e-mail?", "yes-no");

		promptResult
			.pipe(
				filter((result) => result === "yes"),
				switchMap(() => this.authService.getCurrentUser()),
				filter((user) => !!user),
				switchMap((user) => from(this.authService.requestEmailVerification(user))),
				catchError(() => {
					this.snackBar.open("Error sending verification e-mail", "OK", { panelClass: "snackbar-error", duration: 60000 });

					return EMPTY;
				})
			)
			.subscribe(() => this.snackBar.open("Verification e-mail sent", "OK"));
	}

	onInstallClick() {
		if (this.pwaService.isReadyToInstall()) {
			this.pwaService.promptInstallPwa();
		}
	}

	onFeedbackClick() {
		window.open("https://forms.gle/2JqQcvhc7qUPnTPGA", "_blank");
	}

	onLogoutClick() {
		this.authService.logout();
	}

	onNotImplementedClick() {
		alert("This feature is not implemented yet.");
	}
}
