import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { CommunicationChannelService } from "./communication-channel.service";
import { toSignal } from "@angular/core/rxjs-interop";

@Injectable({
	providedIn: "root"
})
export class TelegramConnectorService {
	private telegramService = inject(CommunicationChannelService);

	telegramUsername = toSignal(this.telegramService.getTelegramUsername());

	addConnectCode(connectCode: string): Observable<string> {
		return this.telegramService.setTelegramConnectCode(connectCode).pipe(map(() => connectCode));
	}
}
