import { inject, Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import { DailyTargetsResult } from "@aicoach/shared";
import { filter, map, Observable, switchMap } from "rxjs";
import { doc, docData, Firestore, FirestoreDataConverter } from "@angular/fire/firestore";

@Injectable({
	providedIn: "root"
})
export class DailyTargetsService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);

	private dailyTargetsConverter: FirestoreDataConverter<DailyTargetsResult, DailyTargetsResult> = {
		toFirestore: (model: DailyTargetsResult) => model,
		fromFirestore: (snapshot, options) => snapshot.data(options) as DailyTargetsResult
	};

	getDailyTargets(date: Date): Observable<DailyTargetsResult | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) =>
				doc(this.firestore, "users", uid!, "daily-targets", this.formatDate(date)).withConverter(this.dailyTargetsConverter)
			),
			switchMap((docRef) => docData(docRef))
		);
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	}
}
