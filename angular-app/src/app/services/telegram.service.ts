import { inject, Injectable } from "@angular/core";
import { filter, map, Observable } from "rxjs";
import { CommunicationChannelService } from "./communication-channel.service";
import { UserProfileService } from "./user-profile.service";

@Injectable({
	providedIn: "root"
})
export class TelegramService {
	private communicationChannelService = inject(CommunicationChannelService);
	private profileService = inject(UserProfileService);

	setTelegramConnectCode(connectCode: string): Observable<void> {
		return this.profileService.updateUserProfile({ telegramConnectCode: connectCode });
	}

	getTelegramUsername(): Observable<string | undefined> {
		return this.communicationChannelService.getChannel("telegram").pipe(
			filter((channel) => !!channel),
			map((channel) => channel?.name)
		);
	}
}
