import { Component, inject } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map } from "rxjs";
import { BottomToolbarComponent } from "../bottom-toolbar/bottom-toolbar.component";
import { AuthService } from "../services/auth.service";

@Component({
	imports: [RouterOutlet, BottomToolbarComponent],
	templateUrl: "./app-shell.component.html",
	styleUrl: "./app-shell.component.scss"
})
export class AppShellComponent {
	private authService = inject(AuthService);
	private router = inject(Router);

	isMenuOpen = false;
	userPhotoUrl = toSignal(
		this.authService.getCurrentUser$().pipe(
			takeUntilDestroyed(),
			map((user) => user?.photoURL || undefined)
		)
	);

	constructor() {
		this.router.events
			.pipe(
				takeUntilDestroyed(),
				filter((event) => event instanceof NavigationEnd)
			)
			.subscribe(() => {
				this.isMenuOpen = false;
			});
	}

	async handleLogoutClick(): Promise<void> {
		await this.authService.logout();
	}

	toggleMenu() {
		this.isMenuOpen = !this.isMenuOpen;
	}
}
