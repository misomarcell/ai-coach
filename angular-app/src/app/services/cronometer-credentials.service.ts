import { CronometerCredential, CronometerCredentialDb, CronometerCredentialStatus } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import { deleteDoc, doc, docData, Firestore, FirestoreDataConverter, serverTimestamp, setDoc, Timestamp } from "@angular/fire/firestore";
import { filter, from, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

export interface Credentials {
	username: string;
	password: string;
}

@Injectable({
	providedIn: "root"
})
export class CronometerCredentialsService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);

	private credentialTypeConverter: FirestoreDataConverter<CronometerCredential, CronometerCredentialDb> = {
		toFirestore(model: CronometerCredential): CronometerCredentialDb {
			return {
				...model,
				created: model.created ? Timestamp.fromDate(model.created) : (serverTimestamp() as Timestamp),
				verifiedAt: model.verifiedAt ? Timestamp.fromDate(model.verifiedAt) : undefined
			};
		},
		fromFirestore(snapshot, options): CronometerCredential {
			const data = snapshot.data(options) as CronometerCredentialDb;
			return { ...data, created: data.created.toDate(), verifiedAt: data.verifiedAt?.toDate() };
		}
	};

	createCredentials$(credentials: Credentials): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			switchMap((uid) => {
				const docRef = doc(this.firestore, "users", uid!, "credentials", "cronometer").withConverter(this.credentialTypeConverter);

				return from(
					setDoc(docRef, {
						credentials,
						id: docRef.id,
						created: new Date(),
						status: CronometerCredentialStatus.Processing,
						verifiedAt: undefined
					})
				);
			})
		);
	}

	getCredentials$(): Observable<CronometerCredential | undefined> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const docRef = doc(this.firestore, "users", uid!, "credentials", "cronometer").withConverter(this.credentialTypeConverter);

				return docData(docRef, { idField: "id" });
			})
		);
	}

	deleteCredentials$(): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => doc(this.firestore, "users", uid!, "credentials", "cronometer").withConverter(this.credentialTypeConverter)),
			switchMap((docRef) => from(deleteDoc(docRef)))
		);
	}
}
