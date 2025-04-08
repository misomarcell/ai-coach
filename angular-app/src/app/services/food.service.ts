import { Food, FoodDb, FoodStatus } from "@aicoach/shared";
import { Injectable } from "@angular/core";
import {
	Firestore,
	FirestoreDataConverter,
	Timestamp,
	addDoc,
	collection,
	collectionData,
	doc,
	docData,
	limit,
	query,
	serverTimestamp,
	setDoc,
	where
} from "@angular/fire/firestore";
import { Storage, ref, uploadBytes } from "@angular/fire/storage";
import { Observable, distinctUntilChanged, filter, from, map, of, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class FoodService {
	constructor(
		private firestore: Firestore,
		private storage: Storage,
		private authService: AuthService
	) {}

	private foodTypeConverter: FirestoreDataConverter<Food, FoodDb> = {
		toFirestore(model: Food): FoodDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : (serverTimestamp() as Timestamp),
				lastUpdatedAt: model.lastUpdatedAt ? Timestamp.fromDate(model.lastUpdatedAt) : undefined,
				dietaryFlags: Array.from(model.dietaryFlags ?? [])
			};
		},
		fromFirestore(snapshot, options): Food {
			const data = snapshot.data(options) as FoodDb;
			return {
				...data,
				id: snapshot.id,
				created: (data.created as Timestamp)?.toDate(),
				lastUpdatedAt: (data.lastUpdatedAt as Timestamp)?.toDate(),
				dietaryFlags: data.dietaryFlags ?? []
			};
		}
	};

	createFood(): Observable<string> {
		const collectionRef = collection(this.firestore, "foods").withConverter(this.foodTypeConverter);
		const foodDocument: Partial<Food> = {
			status: FoodStatus.Creating,
			isApproved: false,
			isPublic: false,
			source: "User",
			nutritions: [],
			servingSizes: [],
			images: []
		};

		return this.authService.getCurrentUser$().pipe(
			take(1),
			filter((user) => !!user),
			switchMap((user) => addDoc(collectionRef, { ...foodDocument, ownerUid: user.uid })),
			map((documentRef) => documentRef.id)
		);
	}

	updateFood(foodId: string, food: Partial<Food>): Observable<void> {
		const docRef = doc(this.firestore, `foods/${foodId}`).withConverter(this.foodTypeConverter);
		const foodData: Partial<Food> = {
			...food,
			lastUpdatedAt: new Date()
		};

		return from(setDoc(docRef, foodData, { merge: true }));
	}

	getNewFoodDocumentId(): Observable<string> {
		return this.getUserPendingFood().pipe(
			take(1),
			switchMap((doc) => (doc ? of(doc.id) : this.createFood()))
		);
	}

	getFood(foodId: string): Observable<Food | undefined> {
		return this.authService.getCurrentUser$().pipe(
			filter((user) => !!user),
			map(() => doc(this.firestore, `foods/${foodId}`).withConverter(this.foodTypeConverter)),
			distinctUntilChanged(),
			switchMap((documentRef) => docData(documentRef))
		);
	}

	uploadProductImage(foodId: string, file: File, imageType: "package" | "label"): Observable<string> {
		return this.authService.getCurrentUser$().pipe(
			take(1),
			filter((user) => !!user),
			map((user) => `product-images/${user.uid}/${foodId}/${imageType}`),
			map((filePath) => ({ fileRef: ref(this.storage, filePath), path: filePath })),
			switchMap(({ fileRef, path }) => from(uploadBytes(fileRef, file)).pipe(map(() => path)))
		);
	}

	getFoodByBarcode(barcode: string): Observable<Food | undefined> {
		const collectionRef = collection(this.firestore, "foods").withConverter(this.foodTypeConverter);
		const queryRef = query(collectionRef, where("barcode", "==", barcode));

		return collectionData(queryRef, { idField: "id" }).pipe(map((matches) => matches[0]));
	}

	private getUserPendingFood(): Observable<Food | undefined> {
		const collectionRef = collection(this.firestore, "foods").withConverter(this.foodTypeConverter);

		return this.authService.getCurrentUser$().pipe(
			take(1),
			filter((user) => !!user),
			map((user) => query(collectionRef, where("status", "==", FoodStatus.Creating), where("ownerUid", "==", user.uid), limit(1))),
			switchMap((query) => collectionData(query, { idField: "id" })),
			map((matches) => matches[0])
		);
	}
}
