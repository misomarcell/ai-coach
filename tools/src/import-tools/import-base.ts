import { FoodDb } from "@aicoach/shared";
import { config } from "dotenv";
import { firestore } from "firebase-admin";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { initializeFirestore, WriteBatch } from "firebase-admin/firestore";

export async function initFirestore(isProd: boolean): Promise<void> {
	if (isProd) {
		console.log("!!! Running in production mode !!!");
	}

	config({ path: "../../../.env.local" });

	if (!isProd) {
		process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
	}

	const serviceAccountPath = process.env["SERVICE_ACCOUNT_PATH"] ?? "";
	const FIREBASE_APP = initializeApp({
		credential: isProd ? cert(serviceAccountPath) : applicationDefault(),
		projectId: "kombuch-ai"
	});
	const FIRESTORE = initializeFirestore(FIREBASE_APP);
	FIRESTORE.settings({ ignoreUndefinedProperties: true });
	console.log("Firebase app initialized", { firebaseApp: FIREBASE_APP.name, firestore: FIRESTORE.databaseId });
}

export async function addFoodsToDb(foods: Partial<FoodDb>[]): Promise<void> {
	const collectionRef = firestore().collection("foods");
	const batchSize = 100;
	const batches: WriteBatch[] = [];

	for (let i = 0; i < foods.length; i += batchSize) {
		const chunk = foods.slice(i, i + batchSize);
		const batch = firestore().batch();

		chunk.forEach((food) => {
			if (food.name) {
				const docRef = collectionRef.doc();
				batch.set(docRef, { ...food, id: docRef.id });
			}
		});

		batches.push(batch);
	}

	try {
		for (const batch of batches) {
			await batch.commit();
			console.log(`Committed batch of up to ${batchSize} foods to Firestore`);
		}
		console.log("All foods added to Firestore");
	} catch (error) {
		console.error("Error committing batches to Firestore:", error);
		throw error;
	}
}
