import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatRippleModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { map } from "rxjs";
import { UserService } from "../../services/user.service";

@Component({
	selector: "app-profile-menu",
	imports: [RouterModule, MatIconModule, MatRippleModule],
	templateUrl: "./profile-menu.component.html",
	styleUrl: "./profile-menu.component.scss"
})
export class ProfileMenuComponent {
	private userService = inject(UserService);

	name = toSignal(this.userService.getUserProfile$().pipe(map((profile) => profile?.displayName)), { initialValue: "" });
}
