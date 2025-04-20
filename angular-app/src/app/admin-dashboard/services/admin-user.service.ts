import { HealthProfile, HealthProfileDb, UserProfile, UserProfileDb } from "@aicoach/shared";
import { Injectable, inject } from "@angular/core";
import {
	Firestore,
	FirestoreDataConverter,
	Timestamp,
	collection,
	collectionData,
	doc,
	docData,
	limit,
	orderBy,
	query,
	startAfter
} from "@angular/fire/firestore";
import { Observable } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class AdminUserService {
	private firestore = inject(Firestore);

	private userProfileConverter: FirestoreDataConverter<UserProfile, UserProfileDb> = {
		toFirestore: (model: UserProfile): UserProfileDb => ({
			...model,
			created: Timestamp.fromDate(model.created)
		}),
		fromFirestore(snapshot, options): UserProfile {
			const data = snapshot.data(options) as UserProfileDb;
			return {
				...data,
				id: snapshot.id,
				created: (data.created as Timestamp)?.toDate() || new Date()
			};
		}
	};

	private healthProfileConverter: FirestoreDataConverter<HealthProfile, HealthProfileDb> = {
		toFirestore: (model: HealthProfile): HealthProfileDb => ({
			...model,
			birthDate: Timestamp.fromDate(model.birthDate)
		}),
		fromFirestore(snapshot, options): HealthProfile {
			const data = snapshot.data(options) as HealthProfileDb;
			return {
				...data,
				birthDate: (data.birthDate as Timestamp)?.toDate()
			};
		}
	};

	getUsers(pageSize = 15, lastUser?: UserProfile): Observable<UserProfile[]> {
		const usersCollection = collection(this.firestore, "users").withConverter(this.userProfileConverter);
		let userQuery = query(usersCollection, orderBy("created", "desc"), limit(pageSize));

		if (lastUser) {
			userQuery = query(usersCollection, orderBy("created", "desc"), startAfter(lastUser.created), limit(pageSize));
		}

		return collectionData(userQuery);
	}

	getUserHealthProfile(userId: string): Observable<HealthProfile | undefined> {
		const healthProfileDoc = doc(this.firestore, `users/${userId}/profiles/health-profile`).withConverter(this.healthProfileConverter);

		return docData(healthProfileDoc);
	}
}
