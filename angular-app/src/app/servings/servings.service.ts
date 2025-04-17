import {
	calculateNetCarbs,
	calculateOmega3Total,
	calculateOmega6Total,
	Food,
	Nutrition,
	NutritionType,
	Serving,
	ServingDb,
	ServingFood
} from "@aicoach/shared";
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

	addServing(serving: Partial<Serving>, date?: Date): Observable<string> {
		return this.authService.uid.pipe(
			filter((uid) => !!uid),
			take(1),
			map((uid) => collection(this.firestore, `users/${uid}/servings`).withConverter(this.servingsConverter)),
			map((collectionRef) => doc(collectionRef)),
			switchMap((docRef) =>
				from(
					setDoc(docRef, {
						...serving,
						id: docRef.id,
						created: date ?? new Date()
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

	getFoodNutritions(food: Food | ServingFood): Nutrition[] {
		const nutritionMap = new Map<NutritionType, Nutrition>();

		for (const nutrition of food.nutritions) {
			if (nutritionMap.has(nutrition.type)) {
				nutritionMap.get(nutrition.type)!.amount += nutrition.amount;
			} else {
				nutritionMap.set(nutrition.type, { ...nutrition });
			}
		}

		const calculatedNutritions: Nutrition[] = [
			{ type: "Net Carbs", unit: "g", amount: calculateNetCarbs(Array.from(nutritionMap.values())) },
			{ type: "Omega-3 Total", unit: "g", amount: calculateOmega3Total(Array.from(nutritionMap.values())) },
			{ type: "Omega-6 Total", unit: "g", amount: calculateOmega6Total(Array.from(nutritionMap.values())) }
		];

		console.log({ calculatedNutritions });

		return [...nutritionMap.values(), ...calculatedNutritions];
	}

	getServingNutritions(serving: Serving): Nutrition[] {
		const multiplier = serving.isFinalized ? 1 : ((serving.servingSize.gramWeight || 1) * (serving.servingAmount || 1)) / 100;

		const nutritionMap = new Map<NutritionType, Nutrition>();

		for (const nutrition of serving.food.nutritions) {
			const scaledAmount = nutrition.amount * multiplier;

			if (nutritionMap.has(nutrition.type)) {
				nutritionMap.get(nutrition.type)!.amount += scaledAmount;
			} else {
				nutritionMap.set(nutrition.type, { ...nutrition, amount: scaledAmount });
			}
		}

		const calculatedNutritions: Nutrition[] = [
			{ type: "Net Carbs", unit: "g", amount: calculateNetCarbs(Array.from(nutritionMap.values())) },
			{ type: "Omega-3 Total", unit: "g", amount: calculateOmega3Total(Array.from(nutritionMap.values())) },
			{ type: "Omega-6 Total", unit: "g", amount: calculateOmega6Total(Array.from(nutritionMap.values())) }
		];

		return [...nutritionMap.values(), ...calculatedNutritions];
	}

	getTotalNutritionAmounts(servings: Serving[] = []): Nutrition[] {
		const nutritionMap = new Map<string, Nutrition>();
		servings.forEach((serving) => {
			this.getServingNutritions(serving).forEach(({ type, amount, unit }) => {
				if (!nutritionMap.has(type)) {
					nutritionMap.set(type, { type, amount: 0, unit });
				}
				const existingNutrition = nutritionMap.get(type)!;
				existingNutrition.amount += amount;
			});
		});

		return Array.from(nutritionMap.values());
	}
}
