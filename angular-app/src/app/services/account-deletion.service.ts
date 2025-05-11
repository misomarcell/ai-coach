import { AccountDeletion } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { collection, doc, Firestore, serverTimestamp, setDoc, Timestamp } from "@angular/fire/firestore";
import { filter, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class AccountDeletionService {
	private collectionName = "account-deletions";

	private authService = inject(AuthService);
	private firestore = inject(Firestore);

	private converter = {
		toFirestore: (model: AccountDeletion) => ({
			...model,
			requestedAt: serverTimestamp()
		}),
		fromFirestore: (snapshot: any) => {
			const data = snapshot.data();
			return {
				...data,
				requestedAt: (data.requestedAt as Timestamp).toDate()
			} as AccountDeletion;
		}
	};

	createAccountDeletionRequest(): Observable<void> {
		const collectionRef = collection(this.firestore, this.collectionName).withConverter(this.converter);
		const documentRef = doc(collectionRef);

		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			switchMap((uid) => setDoc(documentRef, { uid: uid!, id: documentRef.id, requestedAt: new Date(), status: "pending" }))
		);
	}
}
