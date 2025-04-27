import { CalorieVision, CalorieVisionDb, CalorieVisionStatus } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	doc,
	docData,
	Firestore,
	FirestoreDataConverter,
	limit,
	orderBy,
	query,
	serverTimestamp,
	Timestamp,
	updateDoc
} from "@angular/fire/firestore";
import { getDownloadURL, ref, Storage } from "@angular/fire/storage";
import { setDoc, where } from "firebase/firestore";
import { filter, from, map, Observable, of, switchMap, take, tap } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({
	providedIn: "root"
})
export class CalorieVisionService {
	private firestore = inject(Firestore);
	private storage = inject(Storage);
	private authService = inject(AuthService);

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

	createVisionDocument() {
		const visionDoc: Partial<CalorieVision> = {
			status: CalorieVisionStatus.Created
		};

		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => collection(this.firestore, "users", uid!, "calorie-vision").withConverter(this.calorieVisionConverter)),
			map((colelctionRef) => doc(colelctionRef)),
			switchMap((docRef) => from(setDoc(docRef, { ...visionDoc, id: docRef.id }, { merge: true })).pipe(map(() => docRef.id)))
		);
	}

	getNewDocument(): Observable<string> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => collection(this.firestore, "users", uid!, "calorie-vision").withConverter(this.calorieVisionConverter)),
			map((collectionRef) => query(collectionRef, where("status", "==", CalorieVisionStatus.Created))),
			switchMap((queryRef) => collectionData(queryRef, { idField: "id" })),
			switchMap((docs) => (docs[0] ? of(docs[0].id) : this.createVisionDocument()))
		);
	}

	submitDocument(documentId: string, fileName: string, description?: string): Observable<string> {
		const update: Partial<CalorieVision> = { fileName, status: CalorieVisionStatus.Submitted };
		if (description) {
			update.imageDescription = description;
		}

		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!, "calorie-vision", documentId).withConverter(this.calorieVisionConverter)),
			switchMap((docRef) => from(updateDoc(docRef, update)).pipe(map(() => docRef.id)))
		);
	}

	getCalorieVision(documentId: string): Observable<CalorieVision | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!, "calorie-vision", documentId).withConverter(this.calorieVisionConverter)),
			switchMap((docRef) => docData(docRef, { idField: "id" })),
			tap((data) => console.log("CalorieVision data:", data))
		);
	}

	getHistory(max = 25): Observable<CalorieVision[]> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) => collection(this.firestore, "users", uid!, "calorie-vision").withConverter(this.calorieVisionConverter)),
			map((collectionRef) => query(collectionRef, orderBy("created", "desc"), limit(max))),
			switchMap((queryRef) => collectionData(queryRef, { idField: "id" }))
		);
	}

	getImageUrlFromFileName(fileName: string): Observable<string> {
		return this.authService.uid.pipe(
			filter((userId) => !!userId),
			take(1),
			map((uid) => `calorie-vision/${uid}/${fileName}`),
			map((filePath) => ref(this.storage, filePath)),
			switchMap((fileRef) => from(getDownloadURL(fileRef)))
		);
	}
}
