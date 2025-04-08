import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { environment } from "../../../environments/environment";
import { TelegramConnectorService } from "../../services/telegram-connector.service";

@Component({
	selector: "app-telegram-integration",
	imports: [ReactiveFormsModule, MatButtonModule, MatExpansionModule, MatIconModule],
	templateUrl: "./telegram-integration.component.html",
	styleUrl: "./telegram-integration.component.scss"
})
export class TelegramIntegrationComponent {
	private telegramService = inject(TelegramConnectorService);

	connectCode = toSignal(this.telegramService.addConnectCode$(this.getRandomCode()));
	telegramUsername = toSignal(this.telegramService.getUsername$());

	private getRandomCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	onConnectClick(connectCode: string): void {
		window.open(`https://t.me/${environment.telegramBotName}?start=${connectCode}`, "_blank");
	}
}
