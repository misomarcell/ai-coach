import { TelegramChannel } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { doc, docData, Firestore, FirestoreDataConverter, setDoc } from "@angular/fire/firestore";
import { filter, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class CommunicationChannelService {
	private authService = inject(AuthService);
	private firestore = inject(Firestore);

	private telegramChannelConverter: FirestoreDataConverter<TelegramChannel, TelegramChannel> = {
		toFirestore: (model: TelegramChannel) => model,
		fromFirestore: (snapshot, options) => snapshot.data(options) as TelegramChannel
	};

	setTelegramConnectCode(connectCode: string): Observable<string> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) =>
				doc(this.firestore, "users", uid!, "communication-channels", "telegram").withConverter(this.telegramChannelConverter)
			),
			switchMap((docRef) => setDoc(docRef, { connectCode }, { merge: true })),
			map(() => connectCode)
		);
	}

	getTelegramUsername(): Observable<string | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) =>
				doc(this.firestore, "users", uid!, "communication-channels", "telegram").withConverter(this.telegramChannelConverter)
			),
			switchMap((docRef) => docData(docRef)),
			map((data) => data?.username)
		);
	}
}
