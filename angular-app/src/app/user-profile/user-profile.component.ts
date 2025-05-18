import { Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute, RouterLink, RouterOutlet } from "@angular/router";

@Component({
	imports: [RouterOutlet, RouterLink, MatButtonModule],
	templateUrl: "./user-profile.component.html",
	styleUrl: "./user-profile.component.scss"
})
export class UserProfileComponent {
	private activatedRoute = inject(ActivatedRoute);

	userProfile = signal(this.activatedRoute.snapshot.data["userProfile"]);

	reload(): void {
		window.location.reload();
	}
}
