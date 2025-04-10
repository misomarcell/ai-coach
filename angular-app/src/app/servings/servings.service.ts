import { Food, Serving, ServingCategory, ServingDb, ServingSize } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	deleteDoc,
	doc,
	docData,
	Firestore,
	FirestoreDataConverter,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	Timestamp,
	where
} from "@angular/fire/firestore";
import { filter, from, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "../services/auth.service";

export interface ServingOptions {
	servingSize: ServingSize;
	servingAmount: number;
	category: ServingCategory;
	isCustomized: boolean;
}

@Injectable({
	providedIn: "root"
})
export class ServingsService {
	private authService = inject(AuthService);
	private firestore = inject(Firestore);

	private servingsConverter: FirestoreDataConverter<Serving, ServingDb> = {
		toFirestore(model: Serving): ServingDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : (serverTimestamp() as Timestamp),
				lastUpdatedAt: model.lastUpdatedAt ? Timestamp.fromDate(model.lastUpdatedAt) : undefined
			};
		},
		fromFirestore(snapshot, options): Serving {
			const data = snapshot.data(options) as ServingDb;
			return {
				...data,
				created: (data.created as Timestamp)?.toDate() || new Date(),
				lastUpdatedAt: data.lastUpdatedAt ? (data.lastUpdatedAt as Timestamp)?.toDate() : undefined
			};
		}
	};

	addServing(food: Food, options: ServingOptions): Observable<string> {
		const { id, name, brand, category, nutritions, tags, isApproved } = food;
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => collection(this.firestore, `users/${uid}/servings`).withConverter(this.servingsConverter)),
			map((collectionRef) => doc(collectionRef)),
			switchMap((docRef) =>
				from(
					setDoc(docRef, {
						...options,
						servingSize: options.servingSize,
						servingAmount: options.servingAmount,
						created: new Date(),
						food: {
							id,
							dietaryFlags: Array.from(food.dietaryFlags || []),
							name,
							category,
							nutritions,
							brand,
							tags,
							isApproved
						},
						id: docRef.id
					}).then(() => docRef.id)
				)
			)
		);
	}

	updateServing(servingId: string, serving: Partial<Serving>): Observable<string> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, `users/${uid}/servings/${servingId}`).withConverter(this.servingsConverter)),
			switchMap((docRef) => from(setDoc(docRef, { ...serving, lastUpdatedAt: new Date() }, { merge: true }).then(() => docRef.id)))
		);
	}

	getServingsByDate(date: Date): Observable<Serving[]> {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const startTimestamp = Timestamp.fromDate(startOfDay);
		const endTimestamp = Timestamp.fromDate(endOfDay);

		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) => {
				const servingsCollection = collection(this.firestore, `users/${uid}/servings`).withConverter(this.servingsConverter);

				return query(
					servingsCollection,
					where("created", ">=", startTimestamp),
					where("created", "<=", endTimestamp),
					orderBy("created", "desc")
				);
			}),
			switchMap((queryRef) => collectionData(queryRef, { idField: "id" }))
		);
	}

	getServingById(servingId: string): Observable<Serving | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) => doc(this.firestore, `users/${uid}/servings/${servingId}`).withConverter(this.servingsConverter)),
			switchMap((docRef) => docData(docRef))
		);
	}

	detele(servingId: string): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, `users/${uid}/servings/${servingId}`)),
			switchMap((docRef) => from(deleteDoc(docRef)))
		);
	}
}
