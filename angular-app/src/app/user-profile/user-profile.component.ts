import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { UserService } from "../services/user.service";
import { toSignal } from "@angular/core/rxjs-interop";
import { UserCardComponent } from "../user-card/user-card.component";

@Component({
	imports: [UserCardComponent],
	templateUrl: "./user-profile.component.html",
	styleUrl: "./user-profile.component.scss"
})
export class UserProfileComponent {
	private activatedRoute = inject(ActivatedRoute);
	private userService = inject(UserService);

	userProfile = toSignal(this.userService.getUserProfile$(this.activatedRoute.snapshot));
}
