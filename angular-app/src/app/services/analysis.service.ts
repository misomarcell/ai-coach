import { AiModel, Analysis, AnalysisDb, AnalysisRequestStatus } from "@aicoach/shared";
import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	deleteDoc,
	doc,
	Firestore,
	FirestoreDataConverter,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	Timestamp,
	where
} from "@angular/fire/firestore";
import { filter, from, map, Observable, switchMap, take } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class AnalysisService {
	private firestore = inject(Firestore);
	private authService = inject(AuthService);
	private analysesConverted: FirestoreDataConverter<Analysis, AnalysisDb> = {
		toFirestore(model: Analysis): AnalysisDb {
			return {
				id: model.id,
				request: {
					...model.request,
					created: model.request.created ? Timestamp.fromDate(model.request.created) : serverTimestamp(),
					completedAt: model.request.completedAt ? Timestamp.fromDate(model.request.completedAt) : undefined
				},
				result: model.result
					? {
							...model.result,
							created: model.result?.created ? Timestamp.fromDate(model.result.created) : serverTimestamp()
						}
					: undefined
			};
		},
		fromFirestore(snapshot, options): Analysis {
			const data = snapshot.data(options) as AnalysisDb;
			return {
				id: snapshot.id,
				request: {
					...data.request,
					created: (data.request.created as Timestamp)?.toDate(),
					completedAt: (data.request.completedAt as Timestamp)?.toDate()
				},
				result: data.result
					? {
							...data.result,
							created: (data.result?.created as Timestamp)?.toDate()
						}
					: undefined
			};
		}
	};

	getAnaylses(): Observable<Analysis[]> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const requestsQuery = query(
					collection(this.firestore, "users", uid!, "analyses").withConverter(this.analysesConverted),
					orderBy("request.created", "desc"),
					limit(25)
				);

				return collectionData(requestsQuery, { idField: "id" });
			})
		);
	}

	getAnalysesByStatus(status: AnalysisRequestStatus[]): Observable<Analysis[]> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const requestsQuery = query(
					collection(this.firestore, "users", uid!, "analyses").withConverter(this.analysesConverted),
					where("request.status", "in", status),
					orderBy("request.created", "desc"),
					limit(25)
				);

				return collectionData(requestsQuery, { idField: "id" });
			})
		);
	}

	createRequest(model: AiModel): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => collection(this.firestore, "users", uid!, "analyses").withConverter(this.analysesConverted)),
			map((collectionRef) => doc(collectionRef)),
			switchMap((docRef) =>
				from(
					setDoc(docRef, {
						id: docRef.id,
						request: {
							model,
							created: new Date(),
							status: AnalysisRequestStatus.Created
						}
					})
				)
			)
		);
	}

	deleteAnalysis(analysisId: string): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			switchMap((uid) => {
				const analysisDoc = doc(this.firestore, "users", uid!, "analyses", analysisId);

				return deleteDoc(analysisDoc);
			}),
			from
		);
	}
}
