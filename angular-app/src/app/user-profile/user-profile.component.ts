import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterOutlet } from "@angular/router";
import { UserProfileService } from "../services/user-profile.service";

@Component({
	imports: [RouterOutlet],
	templateUrl: "./user-profile.component.html",
	styleUrl: "./user-profile.component.scss"
})
export class UserProfileComponent {
	private activatedRoute = inject(ActivatedRoute);
	private userService = inject(UserProfileService);

	userProfile = toSignal(this.userService.getUserProfile(this.activatedRoute.snapshot));
}
