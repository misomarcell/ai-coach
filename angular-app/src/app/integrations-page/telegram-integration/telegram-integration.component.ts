import { Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError, EMPTY, finalize, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { TelegramService } from "../../services/telegram.service";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

@Component({
	selector: "app-telegram-integration",
	imports: [ReactiveFormsModule, MatProgressSpinnerModule, MatButtonModule, MatExpansionModule, MatIconModule],
	templateUrl: "./telegram-integration.component.html",
	styleUrl: "./telegram-integration.component.scss"
})
export class TelegramIntegrationComponent {
	private telegramService = inject(TelegramService);
	private snackBar = inject(MatSnackBar);

	isLoading = signal(false);
	telegramUsername = toSignal(this.telegramService.getTelegramUsername());

	onConnectClick(): void {
		const connectCode = this.getRandomCode();
		this.isLoading.set(true);

		this.telegramService
			.setTelegramConnectCode(connectCode)
			.pipe(
				tap(() => window.open(`https://t.me/${environment.telegramBotName}?start=${connectCode}`, "_blank")),
				catchError(() => {
					this.snackBar.open("Error generating connect code", "OK", { panelClass: "snackbar-error" });
					return EMPTY;
				}),
				finalize(() => this.isLoading.set(false))
			)
			.subscribe();
	}

	private getRandomCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}
}
