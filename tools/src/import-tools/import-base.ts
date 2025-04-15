import { FoodDb } from "@aicoach/shared";
import { config } from "dotenv";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { Firestore, initializeFirestore, WriteBatch } from "firebase-admin/firestore";
import path from "path";
export class FirestoreConnector {
	private firestore: Firestore;

	constructor(isProd = false, debug = false) {
		config({ path: path.resolve(__dirname, "../../.env.local") });
		const serviceAccountPath = process.env["SERVICE_ACCOUNT_PATH"] ?? "";

		if (isProd) {
			console.log("!!! RUNNING IN PRODUCTION MODE !!!");
		} else {
			process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
		}

		if (debug) {
			process.env["GRPC_VERBOSITY"] = "DEBUG";
			process.env["GRPC_TRACE"] = "all";
		}

		console.log(process.env["FIRESTORE_EMULATOR_HOST"]);
		console.log("Reading serving account from ", serviceAccountPath);
		const FIREBASE_APP = initializeApp({
			projectId: "kombuch-ai",
			credential: isProd ? cert(serviceAccountPath) : applicationDefault()
		});

		this.firestore = initializeFirestore(FIREBASE_APP);
		this.firestore.settings({ ignoreUndefinedProperties: true });

		console.log("Firebase app initialized", { app: FIREBASE_APP.options.projectId, databaseId: this.firestore.databaseId });
	}

	async addFoodsToDb(foods: Partial<FoodDb>[]): Promise<void> {
		console.log(`Adding ${foods.length} items to Firestore...`);

		const collectionRef = this.firestore.collection("foods");
		const batchSize = 100;
		const batches: WriteBatch[] = [];

		for (let i = 0; i < foods.length; i += batchSize) {
			const chunk = foods.slice(i, i + batchSize);
			const batch = this.firestore.batch();

			chunk.forEach((food) => {
				if (food.name) {
					const docRef = collectionRef.doc();
					batch.set(docRef, { ...food, id: docRef.id });
				}
			});

			batches.push(batch);
		}

		console.log(`Total of ${batches.length} batches created. Committing...`);

		try {
			for (let i = 0; i < batches.length; i++) {
				await batches[i].commit();
				console.log(`\t Committed batch ${i + 1} of ${batches.length}.`);
			}

			console.log("✅ All batches committed.");
		} catch (error) {
			console.error("❌ Error committing batches to Firestore:", error);
			throw error;
		}
	}
}
