import { TelegramConnection } from "@aicoach/shared";
import { Injectable } from "@angular/core";
import { filter, map, Observable } from "rxjs";
import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class TelegramConnectorService {
	constructor(private userService: UserService) {}

	getUsername$(): Observable<string | undefined> {
		return this.userService.getUserProfile$().pipe(
			filter((userProfile) => !!userProfile),
			map((profile) => profile.telegramConnection?.username)
		);
	}

	addConnectCode$(connectCode: string): Observable<string> {
		const telegramConnection: TelegramConnection = {
			connectCode
		};

		return this.userService.updateUserProfile$({ telegramConnection }).pipe(map(() => connectCode));
	}
}
