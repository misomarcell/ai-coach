import { CalorieVision, CalorieVisionDb } from "@aicoach/shared";
import { Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	Firestore,
	FirestoreDataConverter,
	limit,
	orderBy,
	query,
	serverTimestamp,
	Timestamp
} from "@angular/fire/firestore";
import { getDownloadURL, ref, Storage } from "@angular/fire/storage";
import { filter, from, Observable, switchMap } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class CalorieVisionService {
	private calorieVisionConverter: FirestoreDataConverter<CalorieVision, CalorieVisionDb> = {
		toFirestore(model: CalorieVision): CalorieVisionDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : serverTimestamp()
			};
		},
		fromFirestore(snapshot, options): CalorieVision {
			const data = snapshot.data(options) as CalorieVisionDb;
			return {
				...data,
				created: (data.created as Timestamp)?.toDate()
			};
		}
	};

	constructor(
		private firestore: Firestore,
		private storage: Storage,
		private authService: AuthService
	) {}

	getCalorieVisionResults$(): Observable<CalorieVision[]> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const resultsQuery = query(
					collection(this.firestore, "users", uid!, "calorie-vision").withConverter(this.calorieVisionConverter),
					orderBy("created", "desc"),
					limit(25)
				);

				return collectionData(resultsQuery, { idField: "id" });
			})
		);
	}

	getImageUrlFromFileName(uid: string, fileName: string): Observable<string> {
		const filePath = `calorie-vision/${uid}/${fileName}`;
		const fileRef = ref(this.storage, filePath);

		return from(getDownloadURL(fileRef));
	}
}
