import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Component({
	imports: [
		RouterOutlet,
		RouterLink,
		RouterLinkActive,
		MatButtonModule,
		MatSidenavModule,
		MatMenuModule,
		MatListModule,
		MatToolbarModule,
		MatIconModule,
		MatRippleModule
	],
	templateUrl: "./app-shell.component.html",
	styleUrl: "./app-shell.component.scss"
})
export class AppShellComponent {
	isMenuOpen = false;
	private authService = inject(AuthService);

	async handleLogoutClick(): Promise<void> {
		await this.authService.logout();
	}

	toggleMenu() {
		this.isMenuOpen = !this.isMenuOpen;
	}
}
