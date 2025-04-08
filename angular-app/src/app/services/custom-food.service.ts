import { CronometerFood, CronometerFoodRequest, CronometerFoodRequestDb, CronometerFoodRequestStatus } from "@aicoach/shared";
import { Injectable } from "@angular/core";
import { collection, doc, docData, Firestore, FirestoreDataConverter, serverTimestamp, setDoc, Timestamp } from "@angular/fire/firestore";
import { filter, from, Observable, switchMap } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class CustomFoodService {
	private customFoodConverter: FirestoreDataConverter<CronometerFoodRequest, CronometerFoodRequestDb> = {
		toFirestore(model: CronometerFoodRequest): CronometerFoodRequestDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : serverTimestamp()
			};
		},
		fromFirestore(snapshot, options): CronometerFoodRequest {
			const data = snapshot.data(options) as CronometerFoodRequestDb;
			return { ...data, created: (data.created as Timestamp)?.toDate() };
		}
	};

	constructor(
		private authService: AuthService,
		private firestore: Firestore
	) {}

	createCustomFoodRequest$(food: CronometerFood): Observable<string> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const fustomFoodsCollection = collection(this.firestore, "users", uid!, "custom-foods").withConverter(
					this.customFoodConverter
				);
				const customFoodDoc = doc(fustomFoodsCollection);

				return from(
					setDoc(customFoodDoc, {
						food,
						created: new Date(),
						status: CronometerFoodRequestStatus.Processing
					}).then(() => customFoodDoc.id)
				);
			})
		);
	}

	getCustomFoodRequests$(docId: string): Observable<CronometerFoodRequest | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const document = doc(this.firestore, "users", uid!, "custom-foods", docId).withConverter(this.customFoodConverter);

				return docData(document);
			})
		);
	}
}
