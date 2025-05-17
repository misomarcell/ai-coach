import { Report, ReportDb } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { collection, doc, Firestore, FirestoreDataConverter, Timestamp } from "@angular/fire/firestore";
import { setDoc } from "firebase/firestore";
import { filter, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class ReportService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);

	private reportConverter: FirestoreDataConverter<Report, ReportDb> = {
		toFirestore: (model: Report) => ({ ...model, createdAt: Timestamp.fromDate(model.createdAt || new Date()) }),
		fromFirestore: (snapshot, options) => {
			const data = snapshot.data(options);
			return { ...data, createdAt: (data["createdAt"] as Timestamp)?.toDate() } as Report;
		}
	};

	createReport(report: Omit<Report, "id" | "createdAt" | "createdBy">): Observable<void> {
		const docRef = doc(collection(this.firestore, "reports")).withConverter(this.reportConverter);

		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			switchMap((uid) => setDoc(docRef, { ...report, id: docRef.id, createdBy: uid!, createdAt: new Date() }))
		);
	}
}
