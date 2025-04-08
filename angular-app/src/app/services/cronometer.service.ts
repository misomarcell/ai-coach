import { CronometerExportRequest, CronometerExportRequestDb, CronometerExportSource } from "@aicoach/shared";
import { Injectable } from "@angular/core";
import { Firestore, FirestoreDataConverter, Timestamp, collection, doc, docData, serverTimestamp, setDoc } from "@angular/fire/firestore";
import { Observable, filter, from, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class CronometerService {
	constructor(
		private firestore: Firestore,
		private authService: AuthService
	) {}

	private cronometerExportRequestConverter: FirestoreDataConverter<CronometerExportRequest, CronometerExportRequestDb> = {
		toFirestore(model: CronometerExportRequest): CronometerExportRequestDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : (serverTimestamp() as Timestamp)
			};
		},
		fromFirestore(snapshot, options): CronometerExportRequest {
			const data = snapshot.data(options) as CronometerExportRequestDb;
			return {
				...data,
				created: data.created?.toDate() || new Date()
			};
		}
	};

	requestServingsExport(source: CronometerExportSource): Observable<string> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			switchMap((uid) => {
				const collectionRef = collection(this.firestore, `users/${uid}/export-requests`).withConverter(
					this.cronometerExportRequestConverter
				);

				const docRef = doc(collectionRef);

				return from(
					setDoc(docRef, {
						source,
						id: docRef.id,
						status: "pending",
						service: "cronometer",
						created: new Date()
					}).then(() => docRef.id)
				);
			})
		);
	}

	getExportRequest(exportRequestId: string): Observable<CronometerExportRequest | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const docRef = doc(this.firestore, `users/${uid}/export-requests/${exportRequestId}`).withConverter(
					this.cronometerExportRequestConverter
				);

				return docData(docRef, { idField: "id" });
			})
		);
	}
}
