import { SettingsProfile, SettingsProfileDb } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { doc, docData, Firestore, FirestoreDataConverter, serverTimestamp, setDoc, Timestamp } from "@angular/fire/firestore";
import { filter, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class SettingsProfileService {
	private authService = inject(AuthService);
	private firestore = inject(Firestore);

	private settingsProfileConverter: FirestoreDataConverter<SettingsProfile, SettingsProfileDb> = {
		toFirestore: (model: SettingsProfile): SettingsProfileDb => ({ 
			...model, 
			lastUpdated: model.lastUpdated ? Timestamp.fromDate(model.lastUpdated) : serverTimestamp()
		}),
		fromFirestore(snapshot, options): SettingsProfile {
			const data = snapshot.data(options) as SettingsProfileDb;
			return {
				...data,
				lastUpdated: (data.lastUpdated as unknown as Timestamp)?.toDate()
			};
		}
	};

	setSettingsProfile(settingsProfile: SettingsProfile): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!, "profiles", "settings-profile").withConverter(this.settingsProfileConverter)),
			switchMap((docRef) => setDoc(docRef, settingsProfile, { merge: true }))
		);
	}

	getSettingsProfile(): Observable<SettingsProfile | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!, "profiles", "settings-profile").withConverter(this.settingsProfileConverter)),
			switchMap((docRef) => docData(docRef))
		);
	}
}