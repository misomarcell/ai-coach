import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { map } from "rxjs";
import { AuthService } from "../../services/auth.service";

@Component({
	selector: "app-profile-menu",
	imports: [RouterModule, MatIconModule, MatRippleModule],
	templateUrl: "./profile-menu.component.html",
	styleUrl: "./profile-menu.component.scss"
})
export class ProfileMenuComponent {
	private authService = inject(AuthService);

	name = toSignal(this.authService.getCurrentUser$().pipe(map((u) => u?.displayName)), { initialValue: "" });

	onLogoutClick() {
		this.authService.logout();
	}

	onNotImplementedClick() {
		alert("This feature is not implemented yet.");
	}
}
