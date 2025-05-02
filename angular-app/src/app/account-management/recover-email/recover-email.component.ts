import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { AuthService } from "../../services/auth.service";

@Component({
	imports: [MatButtonModule],
	templateUrl: "./recover-email.component.html",
	styleUrl: "./recover-email.component.scss"
})
export class RecoverEmailComponent {
	private authService = inject(AuthService);

	onRecoverClick(): void {
		//
		console.log(this.authService);
	}
}
