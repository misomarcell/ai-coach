import { UserProfile } from "@aicoach/shared";
import { NgIf, NgStyle } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AuthService } from "../services/auth.service";
@Component({
	selector: "app-user-card",
	imports: [NgStyle, NgIf, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
	templateUrl: "./user-card.component.html",
	styleUrl: "./user-card.component.scss"
})
export class UserCardComponent {
	@Input() telegramUsername: string | undefined;
	@Input() isCronometerConnected: boolean | undefined;
	@Input({ required: true }) user: UserProfile | undefined;
	constructor(
		private authService: AuthService,
		private dialog: MatDialog
	) {}

	async onLogoutClick(): Promise<void> {
		await this.authService.logout();
	}
}
