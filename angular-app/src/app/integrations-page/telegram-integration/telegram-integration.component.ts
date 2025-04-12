import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { environment } from "../../../environments/environment";
import { CommunicationChannelService } from "../../services/communication-channel.service";

@Component({
	selector: "app-telegram-integration",
	imports: [ReactiveFormsModule, MatButtonModule, MatExpansionModule, MatIconModule],
	templateUrl: "./telegram-integration.component.html",
	styleUrl: "./telegram-integration.component.scss"
})
export class TelegramIntegrationComponent {
	private commChannelService = inject(CommunicationChannelService);

	connectCode = toSignal(this.commChannelService.setTelegramConnectCode(this.getRandomCode()));
	telegramUsername = toSignal(this.commChannelService.getTelegramUsername());

	private getRandomCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	onConnectClick(connectCode: string): void {
		window.open(`https://t.me/${environment.telegramBotName}?start=${connectCode}`, "_blank");
	}
}
