import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { Router } from "@angular/router";
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
		await this.authService
			.login(provider)
			.then(() => this.router.navigate(["home"]))
			.catch((error) => console.error("Login error:", error));
	}
}
