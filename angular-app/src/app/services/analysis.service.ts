import { AiModel, Analysis, AnalysisDb, AnalysisPreferences, AnalysisRequestStatus } from "@aicoach/shared";
import { Injectable } from "@angular/core";
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
import { filter, from, map, Observable, switchMap } from "rxjs";

import { AuthService } from "./auth.service";
import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class AnalysisService {
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

	constructor(
		private firestore: Firestore,
		private authService: AuthService,
		private userService: UserService
	) {}

	setAnalysisPreferences$(analysisPreferences: AnalysisPreferences): Observable<void> {
		return this.userService.updateUserProfile$({ analysisPreferences });
	}

	getAnalysisPreferences$(): Observable<AnalysisPreferences | undefined> {
		return this.userService.getUserProfile$().pipe(
			filter((user) => !!user),
			map((userProfile) => userProfile.analysisPreferences)
		);
	}

	getAnaylses$(): Observable<Analysis[]> {
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

	getAnalysesByStatus$(status: AnalysisRequestStatus[]): Observable<Analysis[]> {
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

	createAnalysisRequest$(model: AiModel): Observable<void> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			map((uid) => {
				const analysisRequestCollection = collection(this.firestore, "users", uid!, "analyses").withConverter(
					this.analysesConverted
				);
				const analysisRequestDoc = doc(analysisRequestCollection);

				return setDoc(analysisRequestDoc, {
					id: analysisRequestDoc.id,
					request: {
						model,
						created: new Date(),
						status: AnalysisRequestStatus.Created
					}
				});
			}),
			from
		);
	}

	deleteAnalysis$(analysisId: string): Observable<void> {
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
