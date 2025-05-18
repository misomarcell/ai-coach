import { UserProfile } from "@aicoach/shared";
import { isPlatformBrowser } from "@angular/common";
import { Component, inject, PLATFORM_ID, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { catchError, EMPTY, filter, from, map, switchMap } from "rxjs";
import { AppMenuModule } from "../../menu";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { PromptService } from "../../services/prompt.service";
import { PwaService } from "../../services/pwa.service";

@Component({
	selector: "app-profile-menu",
	imports: [RouterModule, AppMenuModule, MatCardModule, PageTitleComponent, MatIconModule, MatRippleModule],
	templateUrl: "./profile-menu.component.html",
	styleUrl: "./profile-menu.component.scss"
})
export class ProfileMenuComponent {
	private platformId = inject(PLATFORM_ID);
	private authService = inject(AuthService);
	private activatedRoute = inject(ActivatedRoute);
	private promptService = inject(PromptService);
	private snackBar = inject(MatSnackBar);
	private pwaService = inject(PwaService);

	isInstallable = signal(false);
	isShareAvailable = signal(false);
	isEmailVerified = toSignal(
		this.authService.getCurrentUser().pipe(
			filter((user) => !!user),
			map((user) => user?.emailVerified)
		),
		{ initialValue: true }
	);
	isAdmin = toSignal(this.authService.isAdmin(), { initialValue: false });
	name = signal<string>((this.activatedRoute.snapshot.data["userProfile"] as UserProfile)?.displayName || "");

	constructor() {
		this.isInstallable.set(this.pwaService.isReadyToInstall());

		if (isPlatformBrowser(this.platformId)) {
			this.isShareAvailable.set("share" in navigator);
		}
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

	onDiscordClick(): void {
		window.open("https://discord.gg/BJnV9P4az2", "_blank");
	}

	async onShareClick(): Promise<void> {
		return navigator
			.share({
				title: "KombuchAI - Smart Nutrition",
				text: "Counting calories is easy using AI!",
				url: "https://kombuch-ai.web.app/"
			})
			.catch((error) => console.error("Error sharing:", error));
	}

	onFeedbackClick() {
		window.open("https://forms.gle/2JqQcvhc7qUPnTPGA", "_blank");
	}

	onLogoutClick() {
		this.authService.logout();
	}
}
