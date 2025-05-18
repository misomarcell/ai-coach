import { UserProfile, UserProfileDb } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { doc, docData, Firestore, FirestoreDataConverter, serverTimestamp, setDoc, Timestamp } from "@angular/fire/firestore";
import { filter, from, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";
@Injectable({
	providedIn: "root"
})
export class UserProfileService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);

	private userProfileConverter: FirestoreDataConverter<UserProfile, UserProfileDb> = {
		toFirestore(model: UserProfile): UserProfileDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : (serverTimestamp() as Timestamp)
			};
		},
		fromFirestore(snapshot, options): UserProfile {
			const data = snapshot.data(options) as UserProfileDb;
			return {
				...data,
				created: (data.created as Timestamp)?.toDate() || new Date()
			};
		}
	};

	getUserProfile(): Observable<UserProfile | undefined> {
		return this.authService.getCurrentUser().pipe(
			filter((user) => !!user),
			map((user) => doc(this.firestore, "users", user.uid).withConverter(this.userProfileConverter)),
			switchMap((userDoc) => docData(userDoc))
		);
	}

	updateUserProfile(value: Partial<UserProfile>): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!).withConverter(this.userProfileConverter)),
			switchMap((docRef) => from(setDoc(docRef, value, { merge: true })))
		);
	}
}
