import { Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { map } from "rxjs";
import { PageTitleComponent } from "../../page-title/page-title.component";
import { AuthService } from "../../services/auth.service";
import { PwaService } from "../../services/pwa.service";

@Component({
	selector: "app-profile-menu",
	imports: [RouterModule, PageTitleComponent, MatIconModule, MatRippleModule],
	templateUrl: "./profile-menu.component.html",
	styleUrl: "./profile-menu.component.scss"
})
export class ProfileMenuComponent {
	private authService = inject(AuthService);
	private pwaService = inject(PwaService);

	isInstallable = signal(false);
	isAdmin = toSignal(this.authService.isAdmin(), { initialValue: false });
	name = toSignal(this.authService.getCurrentUser().pipe(map((u) => u?.displayName || "")), { initialValue: "" });

	constructor() {
		this.isInstallable.set(this.pwaService.isReadyToInstall());
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
