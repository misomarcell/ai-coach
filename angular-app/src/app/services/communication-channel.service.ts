import { CommunicationChannel, CommunicationChannelDb, CommunicationChannelType } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { collection, collectionData, Firestore, FirestoreDataConverter, query, Timestamp } from "@angular/fire/firestore";
import { filter, map, Observable, switchMap } from "rxjs";
import { AuthService } from "./auth.service";
import { where } from "firebase/firestore";

@Injectable({
	providedIn: "root"
})
export class CommunicationChannelService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);

	private communicationChannelConverter: FirestoreDataConverter<CommunicationChannel, CommunicationChannelDb> = {
		toFirestore: (model: CommunicationChannel) => ({
			...model,
			created: Timestamp.fromDate(model.created || new Date()),
			lastUpdated: Timestamp.fromDate(model.lastUpdated || new Date())
		}),
		fromFirestore: (snapshot, options) => {
			const data = snapshot.data(options);
			return {
				...data,
				created: (data["created"] as Timestamp)?.toDate(),
				lastUpdated: (data["lastUpdated"] as Timestamp)?.toDate()
			} as CommunicationChannel;
		}
	};

	getCommunicationChannels(): Observable<CommunicationChannel[] | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) =>
				collection(this.firestore, "users", uid!, "profiles", "communication-channels").withConverter(
					this.communicationChannelConverter
				)
			),
			switchMap((docRef) => collectionData(docRef, { idField: "id" }))
		);
	}

	getChannel(type: CommunicationChannelType): Observable<CommunicationChannel | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) =>
				collection(this.firestore, "users", uid!, "communication-channels").withConverter(this.communicationChannelConverter)
			),
			map((collectionRef) => query(collectionRef, where("type", "==", type))),
			switchMap((query) => collectionData(query, { idField: "id" })),
			map((channels) => channels[0])
		);
	}
}
