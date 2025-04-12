import { HealthProfile, HealthProfileDb } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { doc, docData, Firestore, FirestoreDataConverter, setDoc, Timestamp } from "@angular/fire/firestore";
import { filter, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class HealthProfileService {
	private authService = inject(AuthService);
	private firestore = inject(Firestore);

	private healthProfileConverter: FirestoreDataConverter<HealthProfile, HealthProfileDb> = {
		toFirestore: (model: HealthProfile): HealthProfileDb => ({ ...model, birthDate: Timestamp.fromDate(model.birthDate) }),
		fromFirestore(snapshot, options): HealthProfile {
			const data = snapshot.data(options) as HealthProfileDb;
			return {
				...data,
				birthDate: (data.birthDate as Timestamp)?.toDate()
			};
		}
	};

	setHealthProfile(healthProfile: HealthProfile): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!, "profiles", "health-profile").withConverter(this.healthProfileConverter)),
			switchMap((docRef) => setDoc(docRef, healthProfile, { merge: true }))
		);
	}

	getHealthProfile(uid: string): Observable<HealthProfile | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map(() => doc(this.firestore, "users", uid!, "profiles", "health-profile").withConverter(this.healthProfileConverter)),
			switchMap((docRef) => docData(docRef))
		);
	}
}
