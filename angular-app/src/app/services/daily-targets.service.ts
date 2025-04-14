import { DailyTargetsResult } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { doc, docData, Firestore, FirestoreDataConverter, Timestamp } from "@angular/fire/firestore";
import { filter, map, Observable, switchMap } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class DailyTargetsService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);

	private dailyTargetsConverter: FirestoreDataConverter<DailyTargetsResult, DailyTargetsResult> = {
		toFirestore: (model: DailyTargetsResult) => ({ ...model, lastUpdated: Timestamp.fromDate(model.lastUpdated || new Date()) }),
		fromFirestore: (snapshot, options) => {
			const data = snapshot.data(options);
			return { ...data, lastUpdated: (data["lastUpdated"] as Timestamp)?.toDate() } as DailyTargetsResult;
		}
	};

	getDailyTargets(): Observable<DailyTargetsResult | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) => doc(this.firestore, "users", uid!, "profiles", "targets-profile").withConverter(this.dailyTargetsConverter)),
			switchMap((docRef) => docData(docRef))
		);
	}
}
