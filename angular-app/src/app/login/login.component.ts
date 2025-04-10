import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { Router } from "@angular/router";
import { first, from, switchMap } from "rxjs";
import { AuthService } from "../services/auth.service";

@Component({
	selector: "app-login",
	imports: [MatButtonModule, MatCardModule],
	templateUrl: "./login.component.html",
	styleUrl: "./login.component.scss"
})
export class LoginComponent {
	authService = inject(AuthService);
	router = inject(Router);

	async onLoginClick(provider: "google" | "github"): Promise<void> {
		this.authService
			.isLoggedIn$()
			.pipe(
				first(),
				switchMap((isLoggedIn) => (isLoggedIn ? this.router.navigate(["home"]) : from(this.authService.login(provider))))
			)
			.subscribe();
	}
}
