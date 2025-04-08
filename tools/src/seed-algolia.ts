import { Algoliasearch, algoliasearch } from "algoliasearch";
import { config } from "dotenv";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldPath, Firestore, initializeFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import path from "path";

async function main() {
	process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:8080";
	config({ path: path.resolve(__dirname, "../.env.local") });

	const FIREBASE_APP = initializeApp({
		credential: applicationDefault(),
		projectId: "kombuch-ai"
	});
	const FIRESTORE = initializeFirestore(FIREBASE_APP);
	FIRESTORE.settings({ ignoreUndefinedProperties: true });

	const algoliaApiKey = process.env["ALGOLIA_DEV_API_KEY"];
	if (!algoliaApiKey) {
		console.error("ERROR: Algolia API key not found in environment variables.");
		return;
	}

	const batchSize = 100;
	const client = algoliasearch("XUT0HRI9ZP", algoliaApiKey);
	const indexName = "foods";

	await client.clearObjects({ indexName });
	await pushDocumentsInBatches(FIRESTORE, indexName, batchSize, client, indexName);
	console.log("All documents pushed to Algolia");
}

async function pushDocumentsInBatches(
	db: Firestore,
	path: string,
	batchSize: number,
	client: Algoliasearch,
	indexName: string
): Promise<void> {
	let lastDoc: QueryDocumentSnapshot | null = null;
	let totalPushed = 0;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		let query = db.collection(path).orderBy(FieldPath.documentId()).limit(batchSize);
		if (lastDoc) {
			query = query.startAfter(lastDoc);
		}

		const snapshot = await query.get();
		const documents = snapshot.docs.map((doc) => doc.data());

		if (documents.length === 0) {
			break;
		}

		await client.saveObjects({ indexName, objects: documents });
		console.log(`Pushed ${documents.length} documents to Algolia (total: ${totalPushed + documents.length})`);

		totalPushed += documents.length;
		lastDoc = snapshot.docs[snapshot.docs.length - 1];
	}
}

(async () => main())();
